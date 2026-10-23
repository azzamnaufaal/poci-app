"""Poci - server perantara tipis di depan Karakeep.

Tugasnya cuma tiga:
1. Menyimpan API key Karakeep di sisi server (tidak pernah sampai ke browser).
2. Menyediakan login Poci sendiri: OAuth Google sebagai jalur utama dan
   password .env sebagai cadangan selama transisi.
3. Meneruskan panggilan frontend ke REST API Karakeep dan sebaliknya.

Semua data simpanan tetap milik Karakeep; Poci tidak menyimpan salinan data.
"""

import os
import secrets
from pathlib import Path

import httpx
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

KARAKEEP_BASE_URL = os.environ.get("KARAKEEP_BASE_URL", "http://karakeep-web-1:3000").rstrip("/")
KARAKEEP_PUBLIC_URL = os.environ.get("KARAKEEP_PUBLIC_URL", "http://ai-core:3000").rstrip("/")
KARAKEEP_API_KEY = os.environ.get("KARAKEEP_API_KEY", "")
POCI_USERNAME = os.environ.get("POCI_USERNAME", "")
POCI_PASSWORD = os.environ.get("POCI_PASSWORD", "")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "")
if not SESSION_SECRET or SESSION_SECRET == "ganti-di-env":
    raise RuntimeError(
        "SESSION_SECRET belum diisi di .env atau masih nilai bawaan. "
        "Isi dengan string acak panjang (openssl rand -hex 32) sebelum server dijalankan."
    )

# Login Google (OAuth/OIDC). Client ID dan secret dibuat di Google Cloud Console;
# redirect URI yang didaftarkan di sana harus sama persis dengan GOOGLE_REDIRECT_URI.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_ALLOWED_EMAIL = os.environ.get("GOOGLE_ALLOWED_EMAIL", "").strip().lower()
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI", "https://poci.ruangkendali.ai.id/auth/google/callback"
)
GOOGLE_ENABLED = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)

# Login password .env adalah cadangan selama transisi ke Google.
# Matikan lewat POCI_PASSWORD_LOGIN=off sesudah login Google terbukti jalan.
PASSWORD_LOGIN_ENABLED = os.environ.get("POCI_PASSWORD_LOGIN", "on").strip().lower() != "off"

# Cookie sesi hanya dikirim lewat HTTPS (browser selalu melihat Poci lewat HTTPS
# Cloudflare). Set SESSION_COOKIE_HTTPS_ONLY=0 hanya untuk uji lokal lewat HTTP.
SESSION_COOKIE_HTTPS_ONLY = os.environ.get("SESSION_COOKIE_HTTPS_ONLY", "1").strip() != "0"

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="Poci")
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    max_age=60 * 60 * 24 * 30,
    https_only=SESSION_COOKIE_HTTPS_ONLY,
)

oauth = OAuth()
if GOOGLE_ENABLED:
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def require_login(request: Request) -> None:
    if not request.session.get("user"):
        raise HTTPException(status_code=401, detail="Belum login")


async def karakeep(request: Request, method: str, path: str, **kwargs) -> httpx.Response:
    """Panggil Karakeep dengan API key server, kembalikan respons apa adanya."""
    require_login(request)
    headers = {"Authorization": f"Bearer {KARAKEEP_API_KEY}"}
    async with httpx.AsyncClient(base_url=KARAKEEP_BASE_URL, timeout=30.0, trust_env=False) as client:
        return await client.request(method, path, headers=headers, **kwargs)


@app.post("/auth/login")
async def login(request: Request):
    if not PASSWORD_LOGIN_ENABLED:
        raise HTTPException(status_code=403, detail="Login password sedang dimatikan")
    body = await request.json()
    username_ok = secrets.compare_digest(str(body.get("username", "")), POCI_USERNAME)
    password_ok = secrets.compare_digest(str(body.get("password", "")), POCI_PASSWORD)
    if username_ok and password_ok and POCI_PASSWORD:
        request.session["user"] = POCI_USERNAME
        return {"ok": True}
    raise HTTPException(status_code=401, detail="Username atau password salah")


@app.get("/auth/config")
async def auth_config():
    # Hanya saklar tampilan layar login, aman dibaca tanpa login.
    return {"google": GOOGLE_ENABLED, "password_login": PASSWORD_LOGIN_ENABLED}


@app.get("/auth/google/login")
async def google_login(request: Request):
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=404, detail="Login Google belum dikonfigurasi")
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)


@app.get("/auth/google/callback")
async def google_callback(request: Request):
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=404, detail="Login Google belum dikonfigurasi")
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(url="/?error=login-gagal")
    userinfo = token.get("userinfo") or {}
    email = str(userinfo.get("email", "")).strip().lower()
    # Hanya satu email pemilik yang boleh masuk, dan wajib terverifikasi Google.
    if not email or userinfo.get("email_verified") is not True or email != GOOGLE_ALLOWED_EMAIL:
        return RedirectResponse(url="/?error=email-tidak-diizinkan")
    request.session["user"] = email
    return RedirectResponse(url="/")


@app.post("/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return {"ok": True}


@app.get("/auth/me")
async def me(request: Request):
    require_login(request)
    return {"user": request.session["user"]}


@app.get("/api/bookmarks")
async def list_bookmarks(request: Request, limit: int = 24, cursor: str | None = None, archived: bool = False):
    params: dict = {"limit": limit, "archived": archived}
    if cursor:
        params["cursor"] = cursor
    r = await karakeep(request, "GET", "/api/v1/bookmarks", params=params)
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.get("/api/bookmarks/search")
async def search_bookmarks(request: Request, q: str, limit: int = 24):
    r = await karakeep(request, "GET", "/api/v1/bookmarks/search", params={"q": q, "limit": limit})
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.get("/api/bookmarks/{bookmark_id}")
async def get_bookmark(request: Request, bookmark_id: str):
    r = await karakeep(request, "GET", f"/api/v1/bookmarks/{bookmark_id}")
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.post("/api/bookmarks")
async def create_bookmark(request: Request):
    body = await request.json()
    r = await karakeep(request, "POST", "/api/v1/bookmarks", json=body)
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.patch("/api/bookmarks/{bookmark_id}")
async def update_bookmark(request: Request, bookmark_id: str):
    body = await request.json()
    r = await karakeep(request, "PATCH", f"/api/v1/bookmarks/{bookmark_id}", json=body)
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.delete("/api/bookmarks/{bookmark_id}")
async def delete_bookmark(request: Request, bookmark_id: str):
    r = await karakeep(request, "DELETE", f"/api/v1/bookmarks/{bookmark_id}")
    return Response(status_code=r.status_code, content=r.content)


@app.get("/api/lists")
async def list_lists(request: Request):
    r = await karakeep(request, "GET", "/api/v1/lists")
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.post("/api/lists")
async def create_list(request: Request):
    body = await request.json()
    r = await karakeep(request, "POST", "/api/v1/lists", json=body)
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.patch("/api/lists/{list_id}")
async def update_list(request: Request, list_id: str):
    body = await request.json()
    r = await karakeep(request, "PATCH", f"/api/v1/lists/{list_id}", json=body)
    return JSONResponse(status_code=r.status_code, content=r.json() if r.content else {})


@app.delete("/api/lists/{list_id}")
async def delete_list(request: Request, list_id: str):
    r = await karakeep(request, "DELETE", f"/api/v1/lists/{list_id}")
    return Response(status_code=r.status_code, content=r.content)


@app.get("/api/lists/{list_id}/bookmarks")
async def list_bookmarks_in_list(request: Request, list_id: str, limit: int = 24, cursor: str | None = None):
    params: dict = {"limit": limit}
    if cursor:
        params["cursor"] = cursor
    r = await karakeep(request, "GET", f"/api/v1/lists/{list_id}/bookmarks", params=params)
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.put("/api/lists/{list_id}/bookmarks/{bookmark_id}")
async def add_to_list(request: Request, list_id: str, bookmark_id: str):
    r = await karakeep(request, "PUT", f"/api/v1/lists/{list_id}/bookmarks/{bookmark_id}")
    return Response(status_code=r.status_code, content=r.content)


@app.delete("/api/lists/{list_id}/bookmarks/{bookmark_id}")
async def remove_from_list(request: Request, list_id: str, bookmark_id: str):
    r = await karakeep(request, "DELETE", f"/api/v1/lists/{list_id}/bookmarks/{bookmark_id}")
    return Response(status_code=r.status_code, content=r.content)


@app.post("/api/bookmarks/{bookmark_id}/recrawl")
async def recrawl_bookmark(request: Request, bookmark_id: str):
    r = await karakeep(request, "POST", f"/api/v1/bookmarks/{bookmark_id}/recrawl")
    return Response(
        status_code=r.status_code,
        content=r.content,
        media_type=r.headers.get("content-type", "application/json"),
    )


@app.get("/api/config")
async def get_config(request: Request):
    require_login(request)
    return {"karakeep_public_url": KARAKEEP_PUBLIC_URL}


@app.get("/api/tags")
async def list_tags(request: Request):
    r = await karakeep(request, "GET", "/api/v1/tags")
    return JSONResponse(status_code=r.status_code, content=r.json())


@app.get("/api/assets/{asset_id}")
async def get_asset(request: Request, asset_id: str):
    """Teruskan berkas aset (gambar sampul, screenshot, unggahan) ke browser."""
    require_login(request)
    headers = {"Authorization": f"Bearer {KARAKEEP_API_KEY}"}
    async with httpx.AsyncClient(base_url=KARAKEEP_BASE_URL, timeout=30.0, trust_env=False) as client:
        r = await client.get(f"/api/v1/assets/{asset_id}", headers=headers)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail="Aset tidak ditemukan")
    return Response(
        content=r.content,
        media_type=r.headers.get("content-type", "application/octet-stream"),
        headers={"Cache-Control": "private, max-age=3600"},
    )


@app.get("/api/health")
async def health(request: Request):
    require_login(request)
    try:
        r = await karakeep(request, "GET", "/api/v1/users/me")
        return {"karakeep": r.status_code == 200}
    except httpx.HTTPError:
        return {"karakeep": False}


# Frontend statis dilayani terakhir supaya rute /api dan /auth menang duluan.
app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
