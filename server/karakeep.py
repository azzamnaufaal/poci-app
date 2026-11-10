"""Klien Karakeep untuk Pocil: REST per pengguna dan pemanggilan tRPC.

Seluruh panggilan memakai kunci milik pengguna yang sedang masuk, kecuali
provisioning yang memakai kunci admin dari environment. Kunci tidak
pernah dikirim ke browser; browser hanya bicara ke server Pocil.
"""

import os
import time
from collections import deque

import httpx

BASE_URL = os.environ.get("KARAKEEP_BASE_URL", "http://karakeep-web-1:3000").rstrip("/")
ADMIN_API_KEY = os.environ.get("KARAKEEP_ADMIN_API_KEY", "")
LEGACY_API_KEY = os.environ.get("KARAKEEP_API_KEY", "")

# Batas provisioning yang didokumentasikan spek: 10 permintaan per 15 menit.
_PROVISION_WINDOW_S = 15 * 60
_PROVISION_MAX = 10
_provision_attempts = deque()


class KarakeepError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def _rest_url(path):
    return f"{BASE_URL}/api/v1{path}"


def rest(api_key, method, path, **kwargs):
    """Panggilan REST generik dengan kunci pengguna. Mengembalikan respons httpx."""
    if not api_key:
        raise KarakeepError("Kunci mesin belum tersedia untuk pengguna ini", 503)
    headers = kwargs.pop("headers", {})
    headers["Authorization"] = f"Bearer {api_key}"
    try:
        with httpx.Client(timeout=30.0, trust_env=False) as client:
            return client.request(method, _rest_url(path), headers=headers, **kwargs)
    except httpx.HTTPError as exc:
        raise KarakeepError(f"Mesin Karakeep tidak terjangkau: {exc}", 503)


def trpc(api_key, procedure, payload):
    """Satu pemanggilan tRPC format batch. Mengembalikan data json hasilnya.

    Prosedur publik seperti apiKeys.exchange dipanggil tanpa kunci.
    """
    url = f"{BASE_URL}/api/trpc/{procedure}?batch=1"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    body = {"0": {"json": payload}}
    try:
        with httpx.Client(timeout=30.0, trust_env=False) as client:
            resp = client.post(url, json=body, headers=headers)
    except httpx.HTTPError as exc:
        raise KarakeepError(f"Mesin Karakeep tidak terjangkau: {exc}", 503)
    try:
        data = resp.json()
    except ValueError:
        raise KarakeepError("Jawaban mesin tidak bisa dibaca", 502)
    entry = data[0] if isinstance(data, list) and data else {}
    if "error" in entry:
        msg = entry["error"].get("json", {}).get("message") or "Panggilan mesin gagal"
        raise KarakeepError(msg, 502)
    result = entry.get("result", {}).get("data", {})
    return result.get("json", result)


def _provision_throttle_ok():
    now = time.time()
    while _provision_attempts and now - _provision_attempts[0] > _PROVISION_WINDOW_S:
        _provision_attempts.popleft()
    if len(_provision_attempts) >= _PROVISION_MAX:
        return False
    _provision_attempts.append(now)
    return True


def provision_user(email, name, password):
    """Buat akun Karakeep lalu tukarkan kredensialnya menjadi kunci API.

    Mengembalikan (karakeep_user_id, api_key). Kata sandi yang dibuat
    server hanya dipakai sekali untuk penukaran, lalu dibuang.
    """
    if not ADMIN_API_KEY:
        raise KarakeepError(
            "Kunci admin mesin belum disetel, provisioning tidak bisa jalan", 503
        )
    if not _provision_throttle_ok():
        raise KarakeepError(
            "Batas provisioning mesin tercapai, coba lagi beberapa menit lagi", 429
        )
    created = trpc(
        ADMIN_API_KEY,
        "admin.createUser",
        {"name": name, "email": email, "password": password, "role": "user"},
    )
    user_id = None
    if isinstance(created, dict):
        user_id = created.get("id") or (created.get("user") or {}).get("id")
    exchanged = trpc(
        None,
        "apiKeys.exchange",
        {"email": email, "password": password, "keyName": "pocil"},
    )
    api_key = exchanged.get("key") if isinstance(exchanged, dict) else None
    if not api_key:
        raise KarakeepError("Penukaran kunci mesin gagal", 502)
    return user_id, api_key


def get_collaborators(api_key, list_id):
    return trpc(api_key, "lists.getCollaborators", {"listId": list_id})


def invite_collaborator(api_key, list_id, email, role):
    return trpc(
        api_key,
        "lists.addCollaborator",
        {"listId": list_id, "email": email, "role": role},
    )


def remove_collaborator(api_key, list_id, user_id):
    return trpc(
        api_key, "lists.removeCollaborator", {"listId": list_id, "userId": user_id}
    )


def update_collaborator_role(api_key, list_id, user_id, role):
    return trpc(
        api_key,
        "lists.updateCollaboratorRole",
        {"listId": list_id, "userId": user_id, "role": role},
    )


def get_lists_of_bookmark(api_key, bookmark_id):
    return trpc(api_key, "lists.getListsOfBookmark", {"bookmarkId": bookmark_id})


def get_pending_invitations(api_key):
    return trpc(api_key, "lists.getPendingInvitations", {})


def accept_invitation(api_key, invitation_id):
    return trpc(api_key, "lists.acceptInvitation", {"invitationId": invitation_id})


def trigger_inference(api_key, status="all"):
    """Pemicu massal penandaan ulang lewat endpoint admin REST."""
    if not api_key:
        raise KarakeepError("Kunci admin mesin belum tersedia", 503)
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        with httpx.Client(timeout=30.0, trust_env=False) as client:
            resp = client.post(
                _rest_url("/admin/jobs/trigger/inference"),
                json={"type": "tag", "status": status},
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise KarakeepError(f"Mesin Karakeep tidak terjangkau: {exc}", 503)
    if resp.status_code >= 400:
        raise KarakeepError(f"Pemicu mesin ditolak ({resp.status_code})", 502)
    try:
        return resp.json()
    except ValueError:
        return {"ok": True}


def _is_manual_list(lst):
    return lst.get("type", "manual") != "smart"


def _paginate(api_key, method, path, key, limit=100, cap=5000, **kwargs):
    items = []
    cursor = None
    while len(items) < cap:
        q = f"{path}?limit={limit}" if "?" not in path else f"{path}&limit={limit}"
        if cursor:
            q += f"&cursor={cursor}"
        resp = rest(api_key, method, q, **kwargs)
        if resp.status_code >= 400:
            raise KarakeepError(f"Mesin menolak permintaan ({resp.status_code})", 502)
        data = resp.json()
        batch = data if isinstance(data, list) else data.get(key, [])
        items.extend(batch)
        cursor = data.get("nextCursor") if isinstance(data, dict) else None
        if not cursor:
            break
    if cursor and len(items) >= cap:
        raise KarakeepError(
            f"Hasil melebihi batas {cap} item; hitung ulang setelah mempersempit data", 413
        )
    return items


def compute_kantong(api_key):
    """Kantong: simpanan tidak terarsip tanpa keanggotaan list manual.

    Mengembalikan (items, count) dengan items terurut dari yang paling
    lama menunggu (createdAt menaik). Daftar dibatasi 5000 simpanan
    supaya satu hitungan tidak membebani mesin tanpa batas.
    """
    lists = _paginate(api_key, "GET", "/lists", "lists")
    manual = [lst for lst in lists if _is_manual_list(lst)]
    member_ids = set()
    for lst in manual:
        members = _paginate(
            api_key, "GET", f"/lists/{lst['id']}/bookmarks", "bookmarks"
        )
        for b in members:
            member_ids.add(b.get("id"))
    bookmarks = _paginate(api_key, "GET", "/bookmarks", "bookmarks")
    queue = [
        b
        for b in bookmarks
        if not b.get("archived") and b.get("id") not in member_ids
    ]
    queue.sort(key=lambda b: b.get("createdAt") or "")
    return queue, len(queue)


def categorize(api_key, bookmark_id, target_list_id):
    """Tambahkan ke tujuan sebelum menghapus keanggotaan list sebelumnya."""
    current = get_lists_of_bookmark(api_key, bookmark_id)
    lists = current if isinstance(current, list) else current.get("lists", [])
    assigned = rest(api_key, "PUT", f"/lists/{target_list_id}/bookmarks/{bookmark_id}")
    if assigned.status_code >= 400:
        raise KarakeepError(f"Gagal masuk ke koleksi ({assigned.status_code})", 502)

    removed = []
    remaining = []
    for lst in lists:
        list_id = lst.get("id") if isinstance(lst, dict) else lst
        if list_id and list_id != target_list_id:
            try:
                resp = rest(
                    api_key,
                    "DELETE",
                    f"/lists/{list_id}/bookmarks/{bookmark_id}",
                )
            except KarakeepError:
                remaining.append(list_id)
                continue
            if resp.status_code < 400:
                removed.append(list_id)
            else:
                remaining.append(list_id)
    return {"removed_from": removed, "remaining_in": remaining}


def remove_from_all_lists(api_key, bookmark_id):
    """Keluarkan simpanan dari semua list manual (dipakai saat arsip)."""
    try:
        current = get_lists_of_bookmark(api_key, bookmark_id)
    except KarakeepError:
        return []
    lists = current if isinstance(current, list) else current.get("lists", [])
    removed = []
    for lst in lists:
        list_id = lst.get("id") if isinstance(lst, dict) else lst
        if not list_id:
            continue
        resp = rest(api_key, "DELETE", f"/lists/{list_id}/bookmarks/{bookmark_id}")
        if resp.status_code < 400:
            removed.append(list_id)
    return removed
