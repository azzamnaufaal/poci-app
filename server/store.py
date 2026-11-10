"""Penyimpanan lokal Pocil: akun, undangan, perangkat pairing, dan setelan.

Hanya memakai sqlite3 bawaan Python. Berkas tinggal di volume data
server (lihat POCIL_DATA_DIR), bukan di dalam kode. Tidak ada rahasia
yang ditulis di sini selain hash token dan hash kode pairing; token
asli dan kunci API Karakeep hanya dipegang pemanggil dan kolom kunci.
"""

import hashlib
import os
import secrets
import sqlite3
import time


def _db_path():
    data_dir = os.environ.get("POCIL_DATA_DIR", "/data")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "pocil.db")


def connect():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    _migrate(conn)
    return conn


def _migrate(conn):
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            picture TEXT,
            role TEXT NOT NULL DEFAULT 'member',
            karakeep_user_id TEXT,
            karakeep_api_key TEXT,
            reminder_enabled INTEGER NOT NULL DEFAULT 0,
            created_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS invitations (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_by TEXT NOT NULL,
            created_at REAL NOT NULL,
            accepted_at REAL
        );
        CREATE TABLE IF NOT EXISTS pairing_codes (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            device_name TEXT NOT NULL,
            expires_at REAL NOT NULL,
            used_at REAL,
            created_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            device_name TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            created_at REAL NOT NULL,
            last_used_at REAL,
            revoked_at REAL
        );
        """
    )
    conn.commit()


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_id():
    return secrets.token_hex(12)


def get_user_by_email(conn, email):
    row = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email.lower(),)
    ).fetchone()
    return dict(row) if row else None


def get_user_by_id(conn, user_id):
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def get_owner(conn):
    row = conn.execute(
        "SELECT * FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1"
    ).fetchone()
    return dict(row) if row else None


def create_user(conn, email, name, picture, role):
    user_id = new_id()
    conn.execute(
        "INSERT INTO users (id, email, name, picture, role, created_at)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, email.lower(), name, picture, role, time.time()),
    )
    conn.commit()
    return get_user_by_id(conn, user_id)


def update_user(conn, user_id, fields):
    sets = ", ".join(f"{k} = ?" for k in fields)
    conn.execute(
        f"UPDATE users SET {sets} WHERE id = ?", (*fields.values(), user_id)
    )
    conn.commit()
    return get_user_by_id(conn, user_id)


def public_user(user):
    if not user:
        return None
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user["picture"],
        "role": user["role"],
        "is_admin": user["role"] == "owner",
        "karakeep_connected": bool(user["karakeep_api_key"]),
        "reminder_enabled": bool(user["reminder_enabled"]),
    }


def list_members(conn):
    rows = conn.execute(
        "SELECT * FROM users ORDER BY created_at"
    ).fetchall()
    return [public_user(dict(r)) for r in rows]


def get_pending_invitation(conn, email):
    row = conn.execute(
        "SELECT * FROM invitations WHERE email = ? AND status = 'pending'"
        " ORDER BY created_at DESC LIMIT 1",
        (email.lower(),),
    ).fetchone()
    return dict(row) if row else None


def list_invitations(conn):
    rows = conn.execute(
        "SELECT * FROM invitations ORDER BY created_at DESC"
    ).fetchall()
    return [dict(r) for r in rows]


def create_invitation(conn, email, created_by):
    inv_id = new_id()
    conn.execute(
        "INSERT INTO invitations (id, email, status, created_by, created_at)"
        " VALUES (?, ?, 'pending', ?, ?)",
        (inv_id, email.lower(), created_by, time.time()),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM invitations WHERE id = ?", (inv_id,)
    ).fetchone()
    return dict(row)


def mark_invitation(conn, inv_id, status):
    conn.execute(
        "UPDATE invitations SET status = ?, accepted_at = ? WHERE id = ?",
        (status, time.time() if status == "accepted" else None, inv_id),
    )
    conn.commit()


def create_pairing_code(conn, user_id, code, device_name, ttl_seconds=600):
    code_id = new_id()
    conn.execute(
        "INSERT INTO pairing_codes"
        " (id, user_id, code_hash, device_name, expires_at, created_at)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        (
            code_id,
            user_id,
            hash_token(code),
            device_name,
            time.time() + ttl_seconds,
            time.time(),
        ),
    )
    conn.commit()
    return code_id


def redeem_pairing_code(conn, code):
    """Klaim pairing code atomik; pemanggil menyimpan perangkat di transaksi sama."""
    conn.execute("BEGIN IMMEDIATE")
    row = conn.execute(
        "SELECT * FROM pairing_codes WHERE code_hash = ? AND used_at IS NULL",
        (hash_token(code),),
    ).fetchone()
    if not row:
        conn.rollback()
        return None
    rec = dict(row)
    now = time.time()
    if rec["expires_at"] <= now:
        conn.rollback()
        return None
    claimed = conn.execute(
        "UPDATE pairing_codes SET used_at = ?"
        " WHERE id = ? AND used_at IS NULL AND expires_at > ?",
        (now, rec["id"], now),
    )
    if claimed.rowcount != 1:
        conn.rollback()
        return None
    return rec


def create_device(conn, user_id, device_name):
    token = secrets.token_urlsafe(32)
    dev_id = new_id()
    conn.execute(
        "INSERT INTO devices (id, user_id, device_name, token_hash, created_at)"
        " VALUES (?, ?, ?, ?, ?)",
        (dev_id, user_id, device_name, hash_token(token), time.time()),
    )
    return dev_id, token


def list_devices(conn, user_id):
    rows = conn.execute(
        "SELECT id, device_name, created_at, last_used_at, revoked_at"
        " FROM devices WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def revoke_device(conn, user_id, device_id):
    cur = conn.execute(
        "UPDATE devices SET revoked_at = ?"
        " WHERE id = ? AND user_id = ? AND revoked_at IS NULL",
        (time.time(), device_id, user_id),
    )
    conn.commit()
    return cur.rowcount > 0


def get_user_by_token(conn, token):
    row = conn.execute(
        "SELECT u.* FROM users u JOIN devices d ON d.user_id = u.id"
        " WHERE d.token_hash = ? AND d.revoked_at IS NULL",
        (hash_token(token),),
    ).fetchone()
    if not row:
        return None
    return dict(row)


def touch_device(conn, token):
    conn.execute(
        "UPDATE devices SET last_used_at = ? WHERE token_hash = ?",
        (time.time(), hash_token(token)),
    )
    conn.commit()
