"""Server Pocil: login Google, undangan, pairing, tangkap, dan proxy Karakeep.

Aplikasi ini adalah satu-satunya yang bicara ke Karakeep. Browser tidak
pernah memegang kunci API mesin. Kantong bukan sebuah list: Kantong
adalah simpanan tidak terarsip tanpa keanggotaan list manual.
"""

import os
import re
import secrets
import time
from collections import defaultdict, deque
from threading import Lock
from urllib.parse import urlsplit

import httpx
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from server import karakeep as kk
from server import store

SESSION_SECRET = os.environ.get("SESSION_SECRET", "")
if not SESSION_SECRET or SESSION_SECRET == "ganti-dengan-rahasia-baru":
    raise RuntimeError("SESSION_SECRET belum disetel di environment")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
OWNER_EMAIL = os.environ.get("POCI_OWNER_EMAIL", "").lower()
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_OWNER_CHAT_ID = os.environ.get("TELEGRAM_OWNER_CHAT_ID", "")
PAIRING_ATTEMPT_WINDOW_SECONDS = 15 * 60
PAIRING_ATTEMPT_LIMIT = 10
MAX_CAPTURE_FILE_BYTES = 20 * 1024 * 1024
MAX_CAPTURE_TEXT_CHARS = 100_000
_pairing_attempts = defaultdict(deque)
_pairing_attempts_lock = Lock()

HERE = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(os.path.dirname(HERE), "web")

app = FastAPI(title="Pocil")
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    https_only=os.environ.get("SESSION_COOKIE_HTTPS_ONLY", "1") != "0",
    same_site="lax",
)

oauth = OAuth()
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def _db():
    return store.connect()


def _current_user(request):
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    with _db() as conn:
        return store.get_user_by_id(conn, user_id)


def _require_user(request):
    user = _current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="harus-masuk")
    return user


def _require_admin(request):
    user = _require_user(request)
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="khusus-admin")
    return user


def _limit_pairing_attempts(request):
    """Batasi tebakan kode per alamat klien dalam jendela 15 menit."""
    address = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _pairing_attempts_lock:
        attempts = _pairing_attempts[address]
        while attempts and now - attempts[0] >= PAIRING_ATTEMPT_WINDOW_SECONDS:
            attempts.popleft()
        if len(attempts) >= PAIRING_ATTEMPT_LIMIT:
            retry_after = max(1, int(PAIRING_ATTEMPT_WINDOW_SECONDS - (now - attempts[0])))
            raise HTTPException(
                status_code=429,
                detail="terlalu-banyak-percobaan-pairing",
                headers={"Retry-After": str(retry_after)},
            )
        attempts.append(now)


def _capture_url(value):
    if not isinstance(value, str):
        raise HTTPException(status_code=400, detail="url-tidak-valid")
    url = value.strip()
    if not url or len(url) > 4096:
        raise HTTPException(status_code=400, detail="url-tidak-valid")
    try:
        parsed = urlsplit(url)
        valid = parsed.scheme.lower() in {"http", "https"} and bool(parsed.hostname)
        _ = parsed.port
    except ValueError:
        valid = False
    if not valid:
        raise HTTPException(status_code=400, detail="url-tidak-valid")
    return url


def _capture_text(value):
    if not isinstance(value, str):
        raise HTTPException(status_code=400, detail="teks-tidak-valid")
    text = value.strip()
    if not text:
        raise HTTPException(status_code=400, detail="teks-tidak-valid")
    if len(text) > MAX_CAPTURE_TEXT_CHARS:
        raise HTTPException(status_code=413, detail="teks-terlalu-panjang")
    return text


def _check_capture_content_length(request):
    raw_length = request.headers.get("content-length")
    if raw_length:
        try:
            length = int(raw_length)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="ukuran-berkas-tidak-valid") from exc
        if length > MAX_CAPTURE_FILE_BYTES + 1024 * 1024:
            raise HTTPException(status_code=413, detail="berkas-terlalu-besar")


async def _read_capture_image(upload):
    if not (upload.content_type or "").lower().startswith("image/"):
        raise HTTPException(status_code=415, detail="hanya-gambar-yang-didukung")
    data = await upload.read(MAX_CAPTURE_FILE_BYTES + 1)
    if len(data) > MAX_CAPTURE_FILE_BYTES:
        raise HTTPException(status_code=413, detail="berkas-terlalu-besar")
    return data


def _user_key(user):
    return user.get("karakeep_api_key") or ""


def _public_me(user):
    data = store.public_user(user)
    data["telegram_linked"] = bool(
        user["role"] == "owner" and TELEGRAM_OWNER_CHAT_ID
    )
    return data


def _owner_machine_credentials(email, name):
    """Return the legacy owner key or provision a personal Karakeep account."""
    if kk.LEGACY_API_KEY:
        return None, kk.LEGACY_API_KEY
    if not kk.ADMIN_API_KEY:
        raise kk.KarakeepError("Kunci admin mesin belum disetel", 503)
    return kk.provision_user(email, name, secrets.token_urlsafe(24))


def _accept_pending_list_invites(user):
    """Terima undangan koleksi yang menunggu, atas nama anggota.

    Best effort: kegagalan di sini tidak menggagalkan login, karena
    undangan bisa diterima ulang dari server saat anggota membuka
    koleksi bersama.
    """
    key = _user_key(user)
    if not key:
        return
    try:
        pending = kk.get_pending_invitations(key)
    except kk.KarakeepError:
        return
    invites = pending if isinstance(pending, list) else pending.get("invitations", [])
    for inv in invites:
        inv_id = inv.get("id") if isinstance(inv, dict) else None
        if not inv_id:
            continue
        try:
            kk.accept_invitation(key, inv_id)
        except kk.KarakeepError:
            continue


@app.get("/auth/config")
def auth_config():
    return {"google": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)}


@app.get("/auth/google/login")
async def google_login(request: Request):
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        raise HTTPException(status_code=503, detail="login-google-belum-disetel")
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or {}
    email = (userinfo.get("email") or "").lower()
    if not email or userinfo.get("email_verified") is not True:
        return RedirectResponse("/?error=email-tidak-terverifikasi", status_code=303)
    name = userinfo.get("name") or email.split("@")[0]
    picture = userinfo.get("picture")

    with _db() as conn:
        existing = store.get_user_by_email(conn, email)
        if existing:
            user = existing
            if user["role"] == "owner" and not _user_key(user):
                try:
                    kid, key = _owner_machine_credentials(email, name)
                except kk.KarakeepError:
                    return RedirectResponse("/?error=provisioning-gagal", status_code=303)
                user = store.update_user(
                    conn,
                    user["id"],
                    {"karakeep_api_key": key, "karakeep_user_id": kid},
                )
            request.session["user_id"] = user["id"]
            _accept_pending_list_invites(user)
            return RedirectResponse("/", status_code=303)

        owner = store.get_owner(conn)
        if owner is None:
            if OWNER_EMAIL and email != OWNER_EMAIL:
                return RedirectResponse("/?error=email-tidak-diundang", status_code=303)
            try:
                kid, key = _owner_machine_credentials(email, name)
            except kk.KarakeepError:
                return RedirectResponse("/?error=provisioning-gagal", status_code=303)
            user = store.create_user(conn, email, name, picture, "owner")
            user = store.update_user(
                conn,
                user["id"],
                {"karakeep_api_key": key, "karakeep_user_id": kid},
            )
            request.session["user_id"] = user["id"]
            return RedirectResponse("/", status_code=303)

        invitation = store.get_pending_invitation(conn, email)
        if not invitation:
            return RedirectResponse("/?error=email-tidak-diundang", status_code=303)
        try:
            kid, key = kk.provision_user(email, name, secrets.token_urlsafe(24))
        except kk.KarakeepError:
            return RedirectResponse("/?error=provisioning-gagal", status_code=303)
        user = store.create_user(conn, email, name, picture, "member")
        store.update_user(
            conn, user["id"], {"karakeep_api_key": key, "karakeep_user_id": kid}
        )
        store.mark_invitation(conn, invitation["id"], "accepted")
        request.session["user_id"] = user["id"]
        _accept_pending_list_invites(user)
        return RedirectResponse("/", status_code=303)


@app.get("/auth/me")
def auth_me(request: Request):
    user = _require_user(request)
    return _public_me(user)


@app.post("/auth/logout")
def auth_logout(request: Request):
    request.session.clear()
    return {"ok": True}


@app.get("/api/me")
def api_me(request: Request):
    return _public_me(_require_user(request))


@app.patch("/api/me")
async def api_me_patch(request: Request):
    user = _require_user(request)
    body = await request.json()
    fields = {}
    if isinstance(body.get("name"), str) and body["name"].strip():
        fields["name"] = body["name"].strip()[:80]
    picture = body.get("picture")
    if isinstance(picture, str) and picture.startswith("data:image/"):
        if len(picture) > 350000:
            raise HTTPException(status_code=413, detail="foto-terlalu-besar")
        fields["picture"] = picture
    if not fields:
        raise HTTPException(status_code=400, detail="tidak-ada-perubahan")
    with _db() as conn:
        updated = store.update_user(conn, user["id"], fields)
    return _public_me(updated)


@app.patch("/api/me/reminder")
async def api_me_reminder(request: Request):
    """Saklar pengingat khusus pemilik. Menyalakan tanpa akun Telegram
    yang tertaut ditolak dengan kode jelas, saklar tidak menyala diam-diam.
    """
    user = _require_user(request)
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="pengingat-khusus-pemilik")
    body = await request.json()
    enabled = bool(body.get("enabled"))
    if enabled and not TELEGRAM_OWNER_CHAT_ID:
        raise HTTPException(status_code=409, detail="telegram-belum-tertaut")
    with _db() as conn:
        updated = store.update_user(
            conn, user["id"], {"reminder_enabled": 1 if enabled else 0}
        )
    return _public_me(updated)


@app.get("/api/admin/members")
def admin_members(request: Request):
    _require_admin(request)
    with _db() as conn:
        return {
            "members": store.list_members(conn),
            "invitations": store.list_invitations(conn),
        }


@app.post("/api/invitations")
async def create_invitation(request: Request):
    admin = _require_admin(request)
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="email-tidak-valid")
    with _db() as conn:
        if store.get_user_by_email(conn, email):
            raise HTTPException(status_code=409, detail="sudah-menjadi-anggota")
        if store.get_pending_invitation(conn, email):
            raise HTTPException(status_code=409, detail="undangan-sudah-ada")
        invitation = store.create_invitation(conn, email, admin["id"])
    return invitation


@app.delete("/api/invitations/{inv_id}")
def revoke_invitation(request: Request, inv_id: str):
    _require_admin(request)
    with _db() as conn:
        store.mark_invitation(conn, inv_id, "revoked")
    return {"ok": True}


@app.get("/api/kantong")
def api_kantong(request: Request):
    user = _require_user(request)
    try:
        items, count = kk.compute_kantong(_user_key(user))
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    return {"items": items, "count": count}


@app.post("/api/kantong/{bookmark_id}/categorize")
async def api_categorize(request: Request, bookmark_id: str):
    user = _require_user(request)
    body = await request.json()
    target = body.get("listId")
    if not target:
        raise HTTPException(status_code=400, detail="koleksi-tujuan-wajib")
    try:
        result = kk.categorize(_user_key(user), bookmark_id, target)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    return {"ok": True, **result}


@app.get("/api/devices")
def api_devices(request: Request):
    user = _require_user(request)
    with _db() as conn:
        return {"devices": store.list_devices(conn, user["id"])}


@app.delete("/api/devices/{device_id}")
def api_device_revoke(request: Request, device_id: str):
    user = _require_user(request)
    with _db() as conn:
        ok = store.revoke_device(conn, user["id"], device_id)
    if not ok:
        raise HTTPException(status_code=404, detail="perangkat-tidak-ditemukan")
    return {"ok": True}


@app.post("/api/pairing/code")
async def api_pairing_code(request: Request):
    """Terbitkan kode pairing 6 digit untuk perangkat baru.

    Kode berlaku 10 menit dan sekali pakai. Token tidak pernah
    diketik pengguna; token diterbitkan saat kode ditukarkan.
    """
    user = _require_user(request)
    body = await request.json()
    device_name = (body.get("device_name") or "Perangkat baru").strip()[:60]
    code = f"{secrets.randbelow(900000) + 100000:06d}"
    display = f"{code[:3]} {code[3:]}"
    with _db() as conn:
        store.create_pairing_code(conn, user["id"], code, device_name)
    return {"code": display, "expires_in_seconds": 600, "device_name": device_name}


@app.post("/api/pairing/redeem")
async def api_pairing_redeem(request: Request):
    """Tukarkan kode pairing menjadi token personal perangkat.

    Endpoint ini yang dipanggil Shortcut: kode dimasukkan sekali,
    token yang kembali disimpan Shortcut sendiri.
    """
    _limit_pairing_attempts(request)
    body = await request.json()
    raw_code = (body.get("code") or "").replace(" ", "").strip()
    device_name = (body.get("device_name") or "Perangkat baru").strip()[:60]
    if not re.fullmatch(r"\d{6}", raw_code):
        raise HTTPException(status_code=400, detail="kode-tidak-valid")
    with _db() as conn:
        rec = store.redeem_pairing_code(conn, raw_code)
        if not rec:
            raise HTTPException(
                status_code=400, detail="kode-salah-atau-kedaluwarsa"
            )
        if device_name == "Perangkat baru" and rec["device_name"]:
            device_name = rec["device_name"]
        device_id, token = store.create_device(conn, rec["user_id"], device_name)
    return {"token": token, "device_id": device_id}


def _capture_user(request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:].strip()
        with _db() as conn:
            user = store.get_user_by_token(conn, token)
            if user:
                store.touch_device(conn, token)
                return user
        raise HTTPException(status_code=401, detail="token-tidak-valid")
    return _require_user(request)


def _create_bookmark_for_user(user, kind, url=None, text=None, asset_id=None):
    key = _user_key(user)
    if kind == "link":
        payload = {"type": "link", "url": url}
    elif kind == "text":
        payload = {"type": "text", "text": text or ""}
    elif kind == "asset":
        payload = {"type": "asset", "assetId": asset_id}
    else:
        raise HTTPException(status_code=400, detail="jenis-tidak-dikenal")
    try:
        resp = kk.rest(key, "POST", "/bookmarks", json=payload)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail="mesin-tidak-terjangkau") from exc
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="gagal-menyimpan-ke-mesin")
    return resp.json()


@app.post("/api/capture")
async def api_capture(request: Request):
    """Satu endpoint gabungan simpan untuk Shortcut dan klien pairing.

    Menerima JSON (tautan atau catatan) atau multipart (gambar).
    Hasilnya selalu mendarat di Kantong karena tidak dimasukkan ke
    list mana pun. Kunci mesin tidak pernah ada di perangkat.
    """
    user = _capture_user(request)
    content_type = request.headers.get("Content-Type", "")
    if "multipart/form-data" in content_type:
        _check_capture_content_length(request)
        form = await request.form()
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=400, detail="berkas-wajib")
        data = await _read_capture_image(upload)
        files = {"file": (upload.filename, data, upload.content_type)}
        try:
            resp = kk.rest(_user_key(user), "POST", "/assets", files=files)
        except kk.KarakeepError as exc:
            raise HTTPException(status_code=exc.status, detail="gagal-mengunggah-aset") from exc
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail="gagal-mengunggah-aset")
        asset_id = resp.json().get("assetId")
        return _create_bookmark_for_user(user, "asset", asset_id=asset_id)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="body-tidak-valid")
    raw_url = body.get("url")
    url = _capture_url(raw_url) if raw_url else ""
    raw_text = body.get("text")
    text = _capture_text(raw_text) if raw_text else ""
    if url:
        return _create_bookmark_for_user(user, "link", url=url)
    if text:
        return _create_bookmark_for_user(user, "text", text=text)
    raise HTTPException(status_code=400, detail="url-atau-teks-wajib")


@app.post("/tangkap")
async def share_target(request: Request):
    """Tujuan share target PWA Android: berbagi dari aplikasi lain
    mendarat di Kantong. Membutuhkan sesi login di PWA.
    """
    user = _current_user(request)
    if not user:
        return RedirectResponse("/?error=harus-masuk", status_code=303)
    try:
        _check_capture_content_length(request)
        form = await request.form()
        title = str(form.get("title") or "")
        text = str(form.get("text") or "")
        url = str(form.get("url") or "")
        file = form.get("file")
        if file is not None:
            if not hasattr(file, "read"):
                raise HTTPException(status_code=400, detail="berkas-tidak-valid")
            data = await _read_capture_image(file)
            files = {"file": (file.filename, data, file.content_type)}
            try:
                resp = kk.rest(_user_key(user), "POST", "/assets", files=files)
            except kk.KarakeepError as exc:
                raise HTTPException(status_code=exc.status, detail="gagal-mengunggah-aset") from exc
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="gagal-mengunggah-aset")
            _create_bookmark_for_user(
                user, "asset", asset_id=resp.json().get("assetId")
            )
        elif url.strip():
            _create_bookmark_for_user(user, "link", url=_capture_url(url))
        elif text.strip() or title.strip():
            _create_bookmark_for_user(
                user, "text", text=_capture_text(text.strip() or title.strip())
            )
    except (HTTPException, kk.KarakeepError):
        return RedirectResponse("/?error=simpan-gagal", status_code=303)
    return RedirectResponse("/?view=kantong", status_code=303)


@app.post("/api/lists/{list_id}/collaborators")
async def api_invite_collaborator(request: Request, list_id: str):
    user = _require_user(request)
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    role = body.get("role")
    if role not in ("viewer", "editor"):
        raise HTTPException(status_code=400, detail="peran-tidak-valid")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="email-tidak-valid")
    try:
        result = kk.invite_collaborator(_user_key(user), list_id, email, role)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    return result


@app.get("/api/lists/{list_id}/collaborators")
def api_get_collaborators(request: Request, list_id: str):
    user = _require_user(request)
    try:
        return kk.get_collaborators(_user_key(user), list_id)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))


@app.delete("/api/lists/{list_id}/collaborators/{member_id}")
def api_remove_collaborator(request: Request, list_id: str, member_id: str):
    user = _require_user(request)
    try:
        kk.remove_collaborator(_user_key(user), list_id, member_id)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    return {"ok": True}


@app.patch("/api/lists/{list_id}/collaborators/{member_id}")
async def api_update_collaborator(request: Request, list_id: str, member_id: str):
    user = _require_user(request)
    body = await request.json()
    role = body.get("role")
    if role not in ("viewer", "editor"):
        raise HTTPException(status_code=400, detail="peran-tidak-valid")
    try:
        kk.update_collaborator_role(_user_key(user), list_id, member_id, role)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    return {"ok": True}


@app.post("/api/lists/invitations/accept-pending")
def api_accept_pending(request: Request):
    user = _require_user(request)
    _accept_pending_list_invites(user)
    return {"ok": True}


@app.post("/api/admin/retrigger-inference")
async def api_retrigger_inference(request: Request):
    """Pemicu massal penandaan ulang (admin). Memakai kunci admin mesin,
    bukan kunci pengguna, karena prosedurnya mensyaratkan peran admin.
    """
    _require_admin(request)
    body = await request.json()
    status = body.get("status", "all")
    if status not in ("all", "failure", "pending", "success"):
        raise HTTPException(status_code=400, detail="status-tidak-valid")
    admin_key = kk.ADMIN_API_KEY or ""
    try:
        result = kk.trigger_inference(admin_key, status)
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    return result


@app.post("/api/reminders/send")
def api_reminder_send(request: Request):
    """Kirim pengingat Kantong ke pemilik lewat Telegram.

    Endpoint ini yang dipanggil penjadwal luar (misalnya cron Astra).
    Anggota tidak pernah mendapat pengingat dari sini.
    """
    user = _require_user(request)
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="pengingat-khusus-pemilik")
    if not user["reminder_enabled"]:
        return {"sent": False, "reason": "pengingat-nonaktif"}
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_OWNER_CHAT_ID:
        return {"sent": False, "reason": "telegram-belum-tertaut"}
    try:
        _, count = kk.compute_kantong(_user_key(user))
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    if count == 0:
        return {"sent": False, "reason": "kantong-kosong"}
    text = (
        f"Pocil: ada {count} simpanan di Kantong yang belum dibereskan. "
        "Buka Beresin Kantong dan pilihkan koleksinya satu per satu."
    )
    try:
        with httpx.Client(timeout=15.0, trust_env=False) as client:
            resp = client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_OWNER_CHAT_ID, "text": text},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"telegram-gagal: {exc}")
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="telegram-menolak-pesan")
    return {"sent": True, "count": count}


@app.get("/api/health")
def health():
    return {"ok": True}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def api_proxy(request: Request, path: str):
    """Proxy tipis ke REST Karakeep dengan kunci milik pengguna."""
    user = _require_user(request)
    key = _user_key(user)
    content_type = request.headers.get("Content-Type", "")
    try:
        if "multipart/form-data" in content_type:
            form = await request.form()
            files = {}
            data = {}
            for field, value in form.multi_items():
                if hasattr(value, "read"):
                    files[field] = (
                        value.filename,
                        await value.read(),
                        value.content_type,
                    )
                else:
                    data[field] = value
            resp = kk.rest(
                key,
                request.method,
                "/" + path,
                files=files or None,
                data=data or None,
            )
        else:
            raw = await request.body()
            resp = kk.rest(
                key,
                request.method,
                "/" + path,
                content=raw if raw else None,
                headers={"Content-Type": "application/json"} if raw else {},
            )
    except kk.KarakeepError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc))
    if resp.status_code == 204 or not resp.content:
        return JSONResponse(content={}, status_code=resp.status_code)
    try:
        return JSONResponse(content=resp.json(), status_code=resp.status_code)
    except ValueError:
        return JSONResponse(content={}, status_code=resp.status_code)


app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
