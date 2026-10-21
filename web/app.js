"use strict";
/* Poci - frontend. Semua data dibaca dari Karakeep lewat server perantara
   (/api/...), API key tidak pernah ada di sisi browser. */

const $ = (sel) => document.querySelector(sel);

// Palet warna pastel-jenuh untuk tab folder dan ubin ikon (hanya aksen kecil)
const FOLDER_COLORS = ["#FE6A73", "#B6DE48", "#FED264", "#9AD1F5", "#F6A6D7", "#FFC38A", "#A8E6B8", "#C9B8F5"];
const TAG_COLORS = ["#FED264", "#B6DE48", "#F6A6D7", "#9AD1F5", "#FFC38A", "#A8E6B8", "#FE6A73", "#C9B8F5"];

const state = {
  lists: [],
  tags: [],
  libraryCursor: null,
  currentListId: null,
  focusQueue: [],
  focusIndex: 0,
  focusListId: null,
};

/* ---------------- Ikon SVG Inline ---------------- */
const ICONS = {
  arrowLeft: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  arrowRight: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  collection: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  bookmark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  tag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  archive: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`,
  trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  mascot: `<svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="poci-mascot"><path d="M10 20h28v14a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V20Z"/><path d="M14 20c0-6 4-10 10-10s10 4 10 10"/><circle cx="24" cy="7" r="2" fill="currentColor"/><path d="M38 24h4a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-4"/><path d="M10 26l-6-4v-2l6 2"/><circle cx="20" cy="28" r="1.5" fill="currentColor"/><circle cx="28" cy="28" r="1.5" fill="currentColor"/><path d="M22 33c1 1 3 1 4 0"/></svg>`,
};

function getListIconSvg(list) {
  const name = ((list.name || "") + " " + (list.description || "")).toLowerCase();
  if (/resep|makan|food|kuliner|masak|cook|recipe|minum|coffee|kopi/i.test(name)) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v20M18 2a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3M6 2v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2M9 11v11"/></svg>`;
  }
  if (/belanja|shop|beli|store|market|cart|promo|flash/i.test(name)) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
  }
  if (/ide|konten|kreatif|inspirasi|brainstorm|idea/i.test(name)) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 0 0 6 8c0 1.05.27 2.05.8 2.92.52.87.98 1.62 1.2 2.58"/></svg>`;
  }
  if (/baca|buku|belajar|read|book|riset|research|study/i.test(name)) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
  }
  if (/belum dibuka|inbox|kotak masuk|unread|later|tinjau/i.test(name)) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;
  }
  if (/travel|jalan|wisata|trip|liburan|plane|flight/i.test(name)) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.9-.2-1.8.3-2.1 1.2-.3.9.1 1.9.9 2.3l6.5 3.9-3.7 3.7-2.7-.4c-.5-.1-1 .1-1.3.5l-.2.3c-.4.5-.3 1.2.2 1.6l2.8 2.3 2.3 2.8c.4.5 1.1.6 1.6.2l.3-.2c.4-.3.6-.8.5-1.3l-.4-2.7 3.7-3.7 3.9 6.5c.4.8 1.4 1.2 2.3.9.9-.3 1.4-1.2 1.2-2.1z"/></svg>`;
  }
  // Fallback netral bergaris tepi konsisten
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
}

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
  if (!iso) return "";
  const d = new Date(iso); const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return "baru saja";
  if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
  if (s < 86400 * 30) return Math.floor(s / 86400) + " hari lalu";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
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

/* ---------------- Kartu simpanan (Ringan & Bersih) ---------------- */
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
  if (c.type === "link") return hostOf(c.url) || "Link";
  if (c.type === "asset") return "Gambar";
  if (c.type === "text") return "Catatan";
  return "";
}
function itemCard(b) {
  const img = cardImage(b);
  const firstTag = (b.tags || [])[0];
  const photo = img
    ? `<img loading="lazy" src="${esc(img)}" alt="">`
    : `<div class="no-photo"><span>${esc(cardTitle(b).slice(0, 24))}</span></div>`;
  const chip = firstTag ? `<span class="item-chip">${esc(firstTag.name)}</span>` : "";
  return `<button class="item-card" data-bookmark="${esc(b.id)}">
    <div class="item-photo">${photo}${chip}</div>
    <div class="item-body">
      <span class="item-title">${esc(cardTitle(b))}</span>
      <span class="item-source">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</span>
    </div>
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

  grid.innerHTML = shown.map((l, i) => {
    const color = FOLDER_COLORS[i % FOLDER_COLORS.length];
    const iconSvg = getListIconSvg(l);
    const countText = l.numBookmarks != null ? `${l.numBookmarks} item` : "Koleksi";
    return `
      <button class="folder-card" data-list="${esc(l.id)}">
        <span class="folder-tab" style="background:${color}"></span>
        <div class="folder-body">
          <div class="folder-top">
            <span class="folder-tile" style="background:${color}">
              ${iconSvg}
            </span>
            <span class="folder-count">${countText}</span>
          </div>
          <span class="folder-name">${esc(l.name)}</span>
        </div>
      </button>`;
  }).join("") || `
    <div class="empty-state">
      ${ICONS.mascot}
      <p>Belum ada koleksi. Buat yang pertama lewat tombol folder di atas.</p>
    </div>`;

  grid.querySelectorAll("[data-list]").forEach((el) =>
    el.addEventListener("click", () => openCollection(el.dataset.list)));

  const recent = asArray(recentData, "bookmarks");
  const wrap = $("#home-recent");
  wrap.innerHTML = recent.map(itemCard).join("") || `
    <div class="empty-state">
      ${ICONS.mascot}
      <p>Belum ada simpanan. Tempel link pertamamu di atas.</p>
    </div>`;
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
    <div class="stat">
      <span class="stat-icon">${ICONS.collection}</span>
      <b>${state.lists.length}</b>
      <span>Koleksi</span>
    </div>
    <div class="stat">
      <span class="stat-icon">${ICONS.bookmark}</span>
      <b>${items.length}+</b>
      <span>Simpanan</span>
    </div>
    <div class="stat">
      <span class="stat-icon">${ICONS.tag}</span>
      <b>${state.tags.length}</b>
      <span>Tag</span>
    </div>`;

  $("#tag-cloud").innerHTML = state.tags.slice(0, 24).map((t, i) =>
    `<button class="price-tag" data-tag="${esc(t.name)}" style="background:${TAG_COLORS[i % TAG_COLORS.length]}"><span class="price-tag-hole"></span><span class="price-tag-name">#${esc(t.name)}</span><small>${t.numBookmarks ?? ""}</small></button>`).join("");
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
  wrap.innerHTML = items.map(itemCard).join("") || `
    <div class="empty-state">
      ${ICONS.mascot}
      <p>Tidak ada hasil untuk "${esc(q)}".</p>
    </div>`;
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
  wrap.innerHTML = items.map(itemCard).join("") || `
    <div class="empty-state">
      ${ICONS.mascot}
      <p>Koleksi ini masih kosong.</p>
    </div>`;
  bindCards(wrap);
}

/* ---------------- Detail ---------------- */
async function openDetail(id) {
  showScreen("detail");
  const wrap = $("#screen-detail");
  wrap.innerHTML = `<div class="empty-state"><p>Memuat detail...</p></div>`;
  const b = await apiJson("/api/bookmarks/" + id);
  const c = b.content || {};
  const img = cardImage(b);
  const tags = (b.tags || []).map((t, i) =>
    `<span class="price-tag" style="background:${TAG_COLORS[i % TAG_COLORS.length]}"><span class="price-tag-hole"></span><span class="price-tag-name">#${esc(t.name)}</span></span>`
  ).join("");
  const openBtn = c.type === "link"
    ? `<a class="btn-primary btn-detail-open" href="${esc(c.url)}" target="_blank" rel="noopener">Buka link</a>`
    : "";
  wrap.innerHTML = `
    <header class="sub-top">
      <button class="btn-square" data-nav="home" aria-label="Kembali">${ICONS.arrowLeft}</button>
      <h2>Detail Simpanan</h2>
    </header>
    ${img ? `<div class="detail-photo-wrap"><img src="${esc(img)}" alt=""></div>` : ""}
    <h1 class="detail-title">${esc(cardTitle(b))}</h1>
    <p class="detail-meta">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</p>
    ${openBtn}
    ${b.summary ? `
      <div class="detail-section-card">
        <h3>Ringkasan AI</h3>
        <p>${esc(b.summary)}</p>
      </div>` : ""}
    ${c.description ? `
      <div class="detail-section-card">
        <h3>Deskripsi</h3>
        <p>${esc(c.description)}</p>
      </div>` : ""}
    ${c.type === "text" ? `
      <div class="detail-section-card">
        <p style="white-space:pre-wrap">${esc(c.text || "")}</p>
      </div>` : ""}
    ${tags ? `
      <div class="detail-tags-wrap">
        <h3>Tag</h3>
        <div class="tag-cloud">${tags}</div>
      </div>` : ""}
    <div class="detail-actions">
      <button class="btn-secondary btn-action-small" id="detail-archive">${ICONS.archive} <span>${b.archived ? "Batal arsip" : "Arsipkan"}</span></button>
      <button class="btn-secondary btn-action-small btn-danger-text" id="detail-delete">${ICONS.trash} <span>Hapus</span></button>
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
  wrap.innerHTML = `<div class="empty-state" style="color:#A9A9A9"><p>Menyiapkan Focus Mode...</p></div>`;
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
  if (state.focusIndex >= q.length || q.length === 0) {
    wrap.innerHTML = `
      <div class="focus-done-wrap">
        ${ICONS.mascot}
        <h2>Selesai ditinjau</h2>
        <p>Semua simpanan di antrean ini sudah kamu lihat. Kerja bagus.</p>
        <button class="btn-primary" id="focus-done" style="max-width:280px;margin-top:8px">Kembali ke Beranda</button>
      </div>`;
    $("#focus-done").addEventListener("click", () => { showScreen("home"); loadHome(); });
    return;
  }
  const b = q[state.focusIndex];
  const c = b.content || {};
  const img = cardImage(b);
  const segs = q.map((_, i) => `<i class="${i <= state.focusIndex ? "done" : ""}"></i>`).join("");
  const tags = (b.tags || []).slice(0, 3).map((t, i) =>
    `<span class="price-tag" style="background:${TAG_COLORS[i % TAG_COLORS.length]}"><span class="price-tag-hole"></span><span class="price-tag-name">#${esc(t.name)}</span></span>`
  ).join("");
  wrap.innerHTML = `
    <header class="focus-top">
      <strong class="focus-label">SIMPANAN BARU</strong>
      <span class="focus-count">${String(state.focusIndex + 1).padStart(2, "0")}/${String(q.length).padStart(2, "0")}</span>
    </header>
    <div class="focus-progress">${segs}</div>
    <div class="focus-card">
      <p class="focus-card-source">${esc(cardSource(b))}</p>
      ${img ? `<div class="focus-card-photo"><img src="${esc(img)}" alt=""></div>` : ""}
      <h3 class="focus-card-title">${esc(cardTitle(b))}</h3>
      ${c.description ? `<p class="focus-card-desc">${esc(c.description.slice(0, 180))}</p>` : ""}
      ${tags ? `<div class="tag-cloud" style="margin-top:12px;margin-bottom:0">${tags}</div>` : ""}
    </div>
    <div class="focus-actions">
      <button class="btn-skip" id="focus-skip" aria-label="Lewati">${ICONS.arrowRight}</button>
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
    const r = await api("/api/lists", { method: "POST", body: JSON.stringify({ name }) });
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
