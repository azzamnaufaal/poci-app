"use strict";
/* Poci - frontend. Semua data dibaca dari Karakeep lewat server perantara
   (/api/...), API key tidak pernah ada di sisi browser. */

const $ = (sel) => document.querySelector(sel);

const FOLDER_COLORS = ["#FE6A73", "#B6DE48", "#FED264", "#9AD1F5", "#F6A6D7", "#FFC38A", "#A8E6B8", "#C9B8F5"];
const TAG_COLORS = ["#FED264", "#B6DE48", "#F6A6D7", "#9AD1F5", "#FFC38A", "#A8E6B8"];

const state = {
  lists: [],
  tags: [],
  libraryCursor: null,
  currentListId: null,
  focusQueue: [],
  focusIndex: 0,
  focusListId: null,
};

/* ---------------- Tema ---------------- */
function applyTheme(choice) {
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelectorAll("#theme-segment button").forEach((b) =>
    b.classList.toggle("active", b.dataset.themeChoice === choice));
}
function initTheme() {
  const saved = localStorage.getItem("poci-theme") || "system";
  applyTheme(saved);
  document.querySelectorAll("#theme-segment button").forEach((b) =>
    b.addEventListener("click", () => {
      localStorage.setItem("poci-theme", b.dataset.themeChoice);
      applyTheme(b.dataset.themeChoice);
    }));
}

/* ---------------- Util ---------------- */
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2600);
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
function timeAgo(iso) {
  const d = new Date(iso); const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return "baru saja";
  if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
  if (s < 86400 * 30) return Math.floor(s / 86400) + " hari lalu";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------------- API ---------------- */
async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (r.status === 401) { showLogin(); throw new Error("unauthorized"); }
  return r;
}
async function apiJson(path, opts) {
  const r = await api(path, opts);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
const asArray = (data, key) => (Array.isArray(data) ? data : data[key] || []);

/* ---------------- Navigasi ---------------- */
const SCREENS = ["home", "library", "search", "detail", "collection", "focus", "settings"];
function showScreen(name) {
  SCREENS.forEach((s) => { const el = $("#screen-" + s); if (el) el.hidden = s !== name; });
  $("#app").hidden = false;
  $("#screen-login").hidden = true;
  window.scrollTo(0, 0);
}
function showLogin() {
  $("#app").hidden = true;
  $("#screen-login").hidden = false;
}

/* ---------------- Kartu simpanan ---------------- */
function cardImage(b) {
  const c = b.content || {};
  if (c.type === "asset" && c.assetId) return "/api/assets/" + c.assetId;
  if (c.imageAssetId) return "/api/assets/" + c.imageAssetId;
  if (c.screenshotAssetId) return "/api/assets/" + c.screenshotAssetId;
  if (c.imageUrl) return c.imageUrl;
  return null;
}
function cardTitle(b) {
  const c = b.content || {};
  return b.title || c.title || (c.type === "asset" ? c.fileName : null) || (c.type === "text" ? (c.text || "").slice(0, 60) : null) || c.url || "Tanpa judul";
}
function cardSource(b) {
  const c = b.content || {};
  if (c.type === "link") return hostOf(c.url);
  if (c.type === "asset") return "Gambar";
  if (c.type === "text") return "Catatan";
  return "";
}
function itemCard(b) {
  const img = cardImage(b);
  const firstTag = (b.tags || [])[0];
  const photo = img
    ? `<img loading="lazy" src="${esc(img)}" alt="">`
    : `<div class="no-photo">${esc(cardTitle(b).slice(0, 22))}</div>`;
  const chip = firstTag ? `<span class="item-chip">${esc(firstTag.name)}</span>` : "";
  return `<button class="item-card" data-bookmark="${esc(b.id)}">
    <span class="item-photo">${photo}${chip}</span>
    <span class="item-body">
      <span class="item-title">${esc(cardTitle(b))}</span>
      <span class="item-source">${esc(cardSource(b))} - ${esc(timeAgo(b.createdAt))}</span>
    </span>
  </button>`;
}
function bindCards(container) {
  container.querySelectorAll("[data-bookmark]").forEach((el) =>
    el.addEventListener("click", () => openDetail(el.dataset.bookmark)));
}

/* ---------------- Beranda ---------------- */
async function loadHome() {
  const [listsData, recentData] = await Promise.all([
    apiJson("/api/lists"),
    apiJson("/api/bookmarks?limit=4"),
  ]);
  state.lists = asArray(listsData, "lists");
  const grid = $("#home-collections");
  const shown = state.lists.slice(0, 6);
  grid.innerHTML = shown.map((l, i) => `
    <button class="folder-card" data-list="${esc(l.id)}" style="background:${FOLDER_COLORS[i % FOLDER_COLORS.length]}">
      <span class="folder-icon">${esc(l.icon || "&#128193;")}</span>
      <span class="folder-name">${esc(l.name)}</span>
      <span class="folder-count">Koleksi</span>
    </button>`).join("") || `<p class="empty-note">Belum ada koleksi. Buat yang pertama lewat tombol folder di atas.</p>`;
  grid.querySelectorAll("[data-list]").forEach((el) =>
    el.addEventListener("click", () => openCollection(el.dataset.list)));

  const recent = asArray(recentData, "bookmarks");
  const wrap = $("#home-recent");
  wrap.innerHTML = recent.map(itemCard).join("") || `<p class="empty-note">Belum ada simpanan. Tempel link pertamamu di atas.</p>`;
  bindCards(wrap);

  // Focus Mode: pakai daftar "Belum Dibuka" bila ada, kalau tidak pakai simpanan terbaru.
  const focusList = state.lists.find((l) => /belum dibuka/i.test(l.name));
  state.focusListId = focusList ? focusList.id : null;
  if (focusList) {
    try {
      const fd = await apiJson(`/api/lists/${focusList.id}/bookmarks?limit=50`);
      $("#review-count").textContent = asArray(fd, "bookmarks").length + " simpanan baru";
    } catch { $("#review-count").textContent = "Simpanan baru"; }
  } else {
    $("#review-count").textContent = recent.length + " simpanan terbaru";
  }
}

/* ---------------- Perpustakaan ---------------- */
async function loadLibrary(reset = true) {
  if (reset) { state.libraryCursor = null; $("#library-items").innerHTML = ""; }
  const q = "/api/bookmarks?limit=24" + (state.libraryCursor ? "&cursor=" + encodeURIComponent(state.libraryCursor) : "");
  const data = await apiJson(q);
  const items = asArray(data, "bookmarks");
  state.libraryCursor = data.nextCursor || null;
  $("#btn-load-more").hidden = !state.libraryCursor;
  $("#library-items").insertAdjacentHTML("beforeend", items.map(itemCard).join(""));
  bindCards($("#library-items"));

  const tagsData = await apiJson("/api/tags");
  state.tags = asArray(tagsData, "tags");
  $("#stats-panel").innerHTML = `
    <div class="stat"><b>${state.lists.length}</b><span>Koleksi</span></div>
    <div class="stat"><b>${items.length}+</b><span>Simpanan</span></div>
    <div class="stat"><b>${state.tags.length}</b><span>Tag</span></div>`;
  $("#tag-cloud").innerHTML = state.tags.slice(0, 18).map((t, i) =>
    `<button class="price-tag" data-tag="${esc(t.name)}" style="background:${TAG_COLORS[i % TAG_COLORS.length]}">${esc(t.name)}<small>${t.numBookmarks ?? ""}</small></button>`).join("");
  $("#tag-cloud").querySelectorAll("[data-tag]").forEach((el) =>
    el.addEventListener("click", async () => {
      showScreen("search");
      $("#search-input").value = el.dataset.tag;
      runSearch(el.dataset.tag);
    }));
}

/* ---------------- Pencarian ---------------- */
async function runSearch(q) {
  const data = await apiJson("/api/bookmarks/search?q=" + encodeURIComponent(q) + "&limit=24");
  const items = asArray(data, "bookmarks");
  const wrap = $("#search-results");
  wrap.innerHTML = items.map(itemCard).join("") || `<p class="empty-note">Tidak ada hasil untuk "${esc(q)}".</p>`;
  bindCards(wrap);
}

/* ---------------- Koleksi ---------------- */
async function openCollection(listId) {
  state.currentListId = listId;
  const list = state.lists.find((l) => l.id === listId);
  $("#collection-title").textContent = list ? list.name : "Koleksi";
  showScreen("collection");
  const data = await apiJson(`/api/lists/${listId}/bookmarks?limit=24`);
  const items = asArray(data, "bookmarks");
  const wrap = $("#collection-items");
  wrap.innerHTML = items.map(itemCard).join("") || `<p class="empty-note">Koleksi ini masih kosong.</p>`;
  bindCards(wrap);
}

/* ---------------- Detail ---------------- */
async function openDetail(id) {
  showScreen("detail");
  const wrap = $("#screen-detail");
  wrap.innerHTML = `<p class="empty-note">Memuat...</p>`;
  const b = await apiJson("/api/bookmarks/" + id);
  const c = b.content || {};
  const img = cardImage(b);
  const tags = (b.tags || []).map((t) => `<span class="price-tag" style="background:${TAG_COLORS[t.name.length % TAG_COLORS.length]}">${esc(t.name)}</span>`).join("");
  const openBtn = c.type === "link" ? `<a class="btn-primary" style="display:block;text-align:center;text-decoration:none" href="${esc(c.url)}" target="_blank" rel="noopener">Buka link - ${esc(hostOf(c.url))}</a>` : "";
  wrap.innerHTML = `
    <header class="sub-top">
      <button class="btn-square" data-nav="home" aria-label="Kembali">&#8592;</button>
      <h2>Detail Simpanan</h2>
    </header>
    ${img ? `<img src="${esc(img)}" alt="" style="width:100%;border:2.5px solid var(--line);border-radius:14px;box-shadow:var(--shadow-sm)">` : ""}
    <h1 style="font-size:23px;font-weight:900;letter-spacing:-.5px;margin:16px 0 6px">${esc(cardTitle(b))}</h1>
    <p style="color:var(--muted);font-weight:600;margin-bottom:14px">${esc(cardSource(b))} - ${esc(timeAgo(b.createdAt))}</p>
    ${openBtn}
    ${b.summary ? `<h3 style="margin:18px 0 6px;font-weight:900">Ringkasan AI</h3><p style="font-weight:500;line-height:1.5">${esc(b.summary)}</p>` : ""}
    ${c.description ? `<h3 style="margin:18px 0 6px;font-weight:900">Deskripsi</h3><p style="font-weight:500;line-height:1.5">${esc(c.description)}</p>` : ""}
    ${c.type === "text" ? `<p style="font-weight:500;line-height:1.5;white-space:pre-wrap">${esc(c.text || "")}</p>` : ""}
    ${tags ? `<h3 style="margin:18px 0 8px;font-weight:900">Tag</h3><div class="tag-cloud">${tags}</div>` : ""}
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn-loadmore" id="detail-archive">${b.archived ? "Keluarkan dari arsip" : "Arsipkan"}</button>
      <button class="btn-loadmore" id="detail-delete" style="color:#C62F3B">Hapus</button>
    </div>`;
  wrap.querySelector("[data-nav]").addEventListener("click", () => { showScreen("home"); loadHome(); });
  $("#detail-archive").addEventListener("click", async () => {
    await api("/api/bookmarks/" + id, { method: "PATCH", body: JSON.stringify({ archived: !b.archived }) });
    toast(b.archived ? "Dikeluarkan dari arsip" : "Diarsipkan");
    showScreen("home"); loadHome();
  });
  $("#detail-delete").addEventListener("click", async () => {
    if (!confirm("Hapus simpanan ini?")) return;
    await api("/api/bookmarks/" + id, { method: "DELETE" });
    toast("Simpanan dihapus");
    showScreen("home"); loadHome();
  });
}

/* ---------------- Focus Mode ---------------- */
async function openFocus() {
  showScreen("focus");
  const wrap = $("#screen-focus");
  wrap.innerHTML = `<p class="empty-note" style="color:#A9A9A9">Menyiapkan Focus Mode...</p>`;
  let items;
  if (state.focusListId) {
    const data = await apiJson(`/api/lists/${state.focusListId}/bookmarks?limit=20`);
    items = asArray(data, "bookmarks");
  } else {
    const data = await apiJson("/api/bookmarks?limit=10");
    items = asArray(data, "bookmarks");
  }
  state.focusQueue = items;
  state.focusIndex = 0;
  renderFocusCard();
}
function renderFocusCard() {
  const wrap = $("#screen-focus");
  const q = state.focusQueue;
  if (state.focusIndex >= q.length) {
    wrap.innerHTML = `
      <h2 style="font-weight:900;font-size:24px">Selesai ditinjau</h2>
      <p style="color:#A9A9A9;font-weight:600;margin:10px 0 22px">Semua simpanan di antrean ini sudah kamu lihat. Kerja bagus.</p>
      <button class="btn-primary" id="focus-done">Kembali ke Beranda</button>`;
    $("#focus-done").addEventListener("click", () => { showScreen("home"); loadHome(); });
    return;
  }
  const b = q[state.focusIndex];
  const c = b.content || {};
  const img = cardImage(b);
  const segs = q.map((_, i) => `<i class="${i <= state.focusIndex ? "done" : ""}"></i>`).join("");
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong style="letter-spacing:2px;font-size:13px">SIMPANAN BARU</strong>
      <span style="font-weight:800">${String(state.focusIndex + 1).padStart(2, "0")}/${String(q.length).padStart(2, "0")}</span>
    </div>
    <div class="focus-progress">${segs}</div>
    <div class="focus-card">
      <p style="font-weight:700;color:#6E6E6E;font-size:13px;margin-bottom:8px">${esc(cardSource(b))}</p>
      ${img ? `<img src="${esc(img)}" alt="">` : ""}
      <h3 style="font-size:20px;font-weight:900;letter-spacing:-.4px;line-height:1.2">${esc(cardTitle(b))}</h3>
      ${c.description ? `<p style="color:#444;font-weight:500;margin-top:8px;line-height:1.45">${esc(c.description.slice(0, 180))}</p>` : ""}
      <div class="tag-cloud" style="margin-top:12px">${(b.tags || []).slice(0, 3).map((t) => `<span class="price-tag" style="background:var(--yellow)">${esc(t.name)}</span>`).join("")}</div>
    </div>
    <div class="focus-actions">
      <button class="btn-skip" id="focus-skip" aria-label="Lewati">&#8594;</button>
      ${c.type === "link" ? `<button class="btn-primary" id="focus-open">Buka link</button>` : `<button class="btn-primary" id="focus-open">Lihat detail</button>`}
    </div>`;
  $("#focus-skip").addEventListener("click", () => { state.focusIndex++; renderFocusCard(); });
  $("#focus-open").addEventListener("click", async () => {
    if (state.focusListId) {
      await api(`/api/lists/${state.focusListId}/bookmarks/${b.id}`, { method: "DELETE" }).catch(() => {});
    }
    if (c.type === "link") window.open(c.url, "_blank");
    state.focusIndex++;
    renderFocusCard();
  });
}

/* ---------------- Acara global ---------------- */
function bindEvents() {
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await fetch("/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: $("#login-username").value, password: $("#login-password").value }),
    });
    if (r.ok) { showScreen("home"); loadHome(); }
    else { const el = $("#login-error"); el.hidden = false; el.textContent = "Username atau password salah."; }
  });

  document.querySelectorAll("[data-nav]").forEach((el) =>
    el.addEventListener("click", () => {
      const target = el.dataset.nav;
      showScreen(target);
      if (target === "home") loadHome();
    }));
  $("#btn-see-library").addEventListener("click", () => { showScreen("library"); loadLibrary(); });
  $("#btn-search").addEventListener("click", () => showScreen("search"));
  $("#btn-settings").addEventListener("click", async () => {
    showScreen("settings");
    try { const h = await apiJson("/api/health"); $("#server-status").textContent = h.karakeep ? "Terhubung ke Karakeep" : "Karakeep tidak terjangkau"; }
    catch { $("#server-status").textContent = "Tidak terjangkau"; }
  });
  $("#btn-focus").addEventListener("click", openFocus);
  $("#btn-load-more").addEventListener("click", () => loadLibrary(false));
  $("#btn-logout").addEventListener("click", async () => { await fetch("/auth/logout", { method: "POST" }); showLogin(); });

  $("#quick-save-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = $("#quick-save-input").value.trim();
    if (!url) return;
    const r = await api("/api/bookmarks", { method: "POST", body: JSON.stringify({ type: "link", url }) });
    if (r.ok) { $("#quick-save-input").value = ""; toast("Tersimpan, sedang diproses"); loadHome(); }
    else toast("Gagal menyimpan, periksa link-nya");
  });

  $("#search-form").addEventListener("submit", (e) => { e.preventDefault(); runSearch($("#search-input").value.trim()); });

  $("#btn-new-collection").addEventListener("click", async () => {
    const name = prompt("Nama koleksi baru:");
    if (!name) return;
    const r = await api("/api/lists", { method: "POST", body: JSON.stringify({ name, icon: "\u{1F4C1}" }) });
    if (r.ok) { toast("Koleksi dibuat"); loadHome(); } else toast("Gagal membuat koleksi");
  });
}

/* ---------------- Mulai ---------------- */
(async function init() {
  initTheme();
  bindEvents();
  try {
    await apiJson("/auth/me");
    showScreen("home");
    loadHome();
  } catch { showLogin(); }
})();
