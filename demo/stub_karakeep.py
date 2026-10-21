"""Karakeep tiruan untuk demo lokal Poci di komputer Muse.
Meniru bentuk respons REST API Karakeep secukupnya untuk layar Poci.
Data contoh meniru simpanan asli user: Threads, Shopee, artikel bertag AI, screenshot.
"""
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI()
SAMPLES = Path(__file__).parent / "samples"

LISTS = [
    {"id": "list-resep", "name": "Resep", "icon": "\U0001F373", "description": None, "parentId": None, "type": "manual", "public": False, "hasCollaborators": False, "userRole": "owner"},
    {"id": "list-belanja", "name": "Belanja", "icon": "\U0001F6D2", "description": None, "parentId": None, "type": "manual", "public": False, "hasCollaborators": False, "userRole": "owner"},
    {"id": "list-ide", "name": "Ide Konten", "icon": "\U0001F4A1", "description": None, "parentId": None, "type": "manual", "public": False, "hasCollaborators": False, "userRole": "owner"},
    {"id": "list-baca", "name": "Baca Nanti", "icon": "\U0001F4DA", "description": None, "parentId": None, "type": "manual", "public": False, "hasCollaborators": False, "userRole": "owner"},
    {"id": "list-belum", "name": "Belum Dibuka", "icon": "\U0001F4E5", "description": None, "parentId": None, "type": "manual", "public": False, "hasCollaborators": False, "userRole": "owner"},
]

def tag(i, name):
    return {"id": f"tag-{i}", "name": name, "attachedBy": "ai"}

BOOKMARKS = [
    {
        "id": "bm-1", "createdAt": "2026-10-21T05:07:00Z", "modifiedAt": None, "title": "Raymond Surya Chin (@raymondchins) on Threads",
        "archived": False, "favourited": False, "taggingStatus": "success", "summarizationStatus": "success",
        "note": None, "summary": None, "source": "api", "userId": "u1",
        "tags": [tag(1, "threads"), tag(2, "inspirasi")],
        "content": {"type": "link", "url": "https://www.threads.net/@raymondchins", "title": "Raymond Surya Chin (@raymondchins) on Threads",
                    "description": "Utas tentang membangun personal branding dari nol.", "imageUrl": None, "imageAssetId": "asset-img11", "screenshotAssetId": "asset-img11"},
        "assets": [],
    },
    {
        "id": "bm-2", "createdAt": "2026-10-21T04:52:00Z", "modifiedAt": None, "title": "Shopee Indonesia | Situs Belanja Online Terlengkap & Terpercaya",
        "archived": False, "favourited": False, "taggingStatus": "success", "summarizationStatus": None,
        "note": None, "summary": None, "source": "api", "userId": "u1",
        "tags": [tag(3, "belanja")],
        "content": {"type": "link", "url": "https://shopee.co.id", "title": "Shopee Indonesia | Situs Belanja Online Terlengkap & Terpercaya",
                    "description": None, "imageUrl": None, "imageAssetId": "asset-img22", "screenshotAssetId": "asset-img22"},
        "assets": [],
    },
    {
        "id": "bm-3", "createdAt": "2026-10-21T04:30:00Z", "modifiedAt": None, "title": "Cara Kerja AI Agent di Homelab Kecil",
        "archived": False, "favourited": True, "taggingStatus": "success", "summarizationStatus": "success",
        "note": None, "summary": "Artikel ini membahas cara menjalankan AI agent di perangkat kecil rumahan dengan Docker, lengkap dengan pola jaringan dan backup yang aman.",
        "source": "api", "userId": "u1",
        "tags": [tag(4, "kecerdasan-buatan"), tag(5, "homelab"), tag(6, "docker")],
        "content": {"type": "link", "url": "https://contoh-artikel.id/ai-agent-homelab", "title": "Cara Kerja AI Agent di Homelab Kecil",
                    "description": "Panduan praktis menjalankan agent AI di Mini PC rumahan.", "imageUrl": None, "imageAssetId": "asset-img33", "screenshotAssetId": None},
        "assets": [],
    },
    {
        "id": "bm-4", "createdAt": "2026-10-21T03:15:00Z", "modifiedAt": None, "title": None,
        "archived": False, "favourited": False, "taggingStatus": "success", "summarizationStatus": None,
        "note": None, "summary": None, "source": "api", "userId": "u1",
        "tags": [tag(7, "promo"), tag(8, "flash-sale")],
        "content": {"type": "asset", "assetType": "image", "assetId": "asset-img44", "fileName": "screenshot-promo.png"},
        "assets": [],
    },
    {
        "id": "bm-5", "createdAt": "2026-10-20T14:00:00Z", "modifiedAt": None, "title": "Catatan ide: kolaborasi brand lokal",
        "archived": False, "favourited": False, "taggingStatus": None, "summarizationStatus": None,
        "note": None, "summary": None, "source": "api", "userId": "u1",
        "tags": [tag(9, "ide-konten")],
        "content": {"type": "text", "text": "Ide: ajak brand lokal untuk seri konten mingguan, format storytelling, bukan hard selling."},
        "assets": [],
    },
]

LIST_MEMBERS = {
    "list-resep": [],
    "list-belanja": ["bm-2", "bm-4"],
    "list-ide": ["bm-1", "bm-5"],
    "list-baca": ["bm-3"],
    "list-belum": ["bm-1", "bm-3", "bm-4"],
}

TAGS = [
    {"id": f"tag-{i}", "name": n, "numBookmarks": c, "numBookmarksByAttachedType": {"ai": c, "human": 0}}
    for i, (n, c) in enumerate([
        ("kecerdasan-buatan", 12), ("homelab", 8), ("docker", 5), ("belanja", 9),
        ("promo", 6), ("flash-sale", 3), ("ide-konten", 11), ("threads", 4), ("inspirasi", 7),
    ], start=1)
]

ASSET_FILES = {"asset-img11": "img11.jpg", "asset-img22": "img22.jpg", "asset-img33": "img33.jpg", "asset-img44": "img44.jpg"}


@app.get("/api/v1/users/me")
def me():
    return {"id": "u1", "name": "Naufal", "email": "demo@lokal"}


@app.get("/api/v1/bookmarks")
def bookmarks(limit: int = 24, cursor: str | None = None):
    start = int(cursor) if cursor else 0
    page = BOOKMARKS[start:start + limit]
    nxt = str(start + limit) if start + limit < len(BOOKMARKS) else None
    return {"bookmarks": page, "nextCursor": nxt}


@app.get("/api/v1/bookmarks/search")
def search(q: str, limit: int = 24):
    ql = q.lower()
    hits = [b for b in BOOKMARKS if ql in (b.get("title") or "").lower()
            or any(ql in t["name"] for t in b["tags"])
            or ql in (b["content"].get("description") or "").lower()
            or ql in (b["content"].get("text") or "").lower()]
    return {"bookmarks": hits, "nextCursor": None}


@app.get("/api/v1/bookmarks/{bid}")
def one(bid: str):
    for b in BOOKMARKS:
        if b["id"] == bid:
            return b
    return JSONResponse(status_code=404, content={"code": "NOT_FOUND", "message": "tidak ada"})


@app.post("/api/v1/bookmarks")
def create(body: dict):
    return JSONResponse(status_code=201, content=BOOKMARKS[0])


@app.patch("/api/v1/bookmarks/{bid}")
def patch(bid: str, body: dict):
    return one(bid)


@app.delete("/api/v1/bookmarks/{bid}")
def delete(bid: str):
    return JSONResponse(status_code=200, content={"success": True})


@app.get("/api/v1/lists")
def lists():
    return {"lists": LISTS}


@app.post("/api/v1/lists")
def create_list(body: dict):
    return JSONResponse(status_code=201, content=LISTS[0])


@app.get("/api/v1/lists/{lid}/bookmarks")
def list_bookmarks(lid: str, limit: int = 24, cursor: str | None = None):
    ids = LIST_MEMBERS.get(lid, [])
    items = [b for b in BOOKMARKS if b["id"] in ids]
    return {"bookmarks": items, "nextCursor": None}


@app.put("/api/v1/lists/{lid}/bookmarks/{bid}")
def add(lid: str, bid: str):
    return JSONResponse(status_code=200, content={"success": True})


@app.delete("/api/v1/lists/{lid}/bookmarks/{bid}")
def remove(lid: str, bid: str):
    return JSONResponse(status_code=200, content={"success": True})


@app.get("/api/v1/tags")
def tags():
    return {"tags": TAGS}


@app.get("/api/v1/assets/{aid}")
def asset(aid: str):
    f = ASSET_FILES.get(aid)
    if not f:
        return JSONResponse(status_code=404, content={"message": "tidak ada"})
    return FileResponse(SAMPLES / f, media_type="image/jpeg")
