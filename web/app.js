"use strict";
/* Pocil - frontend. Semua data dibaca dari Karakeep lewat server perantara
   (/api/...), kunci mesin tidak pernah ada di sisi browser. Kantong bukan
   sebuah list: Kantong adalah simpanan tidak terarsip tanpa keanggotaan
   list manual. Simpanan baru tidak dimasukkan ke list mana pun, jadi
   otomatis mendarat di Kantong. */

const $ = (sel) => document.querySelector(sel);

/* Ikon garis konsisten, satu pembungkus SVG untuk semua ikon */
const ICON_PATHS = {
  folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  group: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19c.8-3 3.2-4.5 6.5-4.5s5.7 1.5 6.5 4.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16.5 14.6c2.7.3 4.6 1.7 5.2 4.4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  archive: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
  move: '<polyline points="9 18 15 12 9 6"/><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  open: '<path d="M8 16L16 8M9.5 8H16v6.5"/>',
  pencil: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
  arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  card: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
};
function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || "") + "</svg>";
}
function logoSVG(width) {
  return '<svg class="logo-anim" style="width:' + width + 'px; height:auto;" viewBox="0 0 72 52" fill="none" aria-hidden="true"><g class="card-in"><rect x="27" y="2" width="18" height="20" rx="3" style="fill:var(--yellow)" stroke="currentColor" stroke-width="3"/><path d="M31 8.5h10M31 13.5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g><path d="M14 14h44v16c0 11-10 19-22 19S14 41 14 30z" style="fill:var(--pink)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M19 19.5h34" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/><circle cx="36" cy="41" r="2.6" style="fill:var(--yellow)" stroke="currentColor" stroke-width="2.5"/></svg>';
}
function groupSVG() {
  return icon("group");
}

const state = {
  me: null,
  lists: [],
  kantongItems: [],
  kantongCount: 0,
  kantongOffline: false,
  currentView: "koleksi",
  detailReturn: null,
  currentListId: null,
  collectionItems: [],
  viewMode: "list",
  searchQ: "",
  searchTag: null,
  searchTagId: null,
  searchResults: [],
  tags: [],
  focusQueue: [],
  focusIndex: 0,
  greeted: false,
  koleksiScroll: 0,
  suppressClick: false,
  collaboratorsCache: new Map(),
  membershipCache: new Map(),
};

/* Tema: pilihan eksplisit terang atau gelap, default mengikuti sistem */
function terapkanTema(pilihan) {
  if (pilihan !== "light" && pilihan !== "dark") {
    pilihan = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = pilihan;
  document.querySelectorAll(".theme-switch button").forEach((b) =>
    b.classList.toggle("active", b.dataset.themeChoice === pilihan));
}
function initTema() {
  const saved = localStorage.getItem("pocil-theme");
  if (saved === "light" || saved === "dark") terapkanTema(saved);
  else terapkanTema("system");
}

/* Util */
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
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${monthNames[d.getMonth()] || ""} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}
function judulBersih(b, isDetail = false) {
  const c = b.content || {};
  const rawTitle = String(b.title || c.title || (c.type === "asset" ? c.fileName : null) || c.url || "Tanpa judul").trim();
  const igMatch = rawTitle.match(/^(.+?)\s+on Instagram:\s*["“](.*?)["”]?$/is);
  if (igMatch) {
    let caption = (igMatch[2] || "").trim();
    if (!caption) return igMatch[1].trim();
    const sentenceMatch = caption.match(/^(.+?[.!?])(?:\s|$)/s);
    if (sentenceMatch) caption = sentenceMatch[1].trim();
    if (caption.length > 90) {
      const cut = caption.slice(0, 90);
      const lastSpace = cut.lastIndexOf(" ");
      caption = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "...";
    }
    return caption;
  }
  if (!isDetail && rawTitle.length > 140) {
    const sentenceMatch = rawTitle.match(/^(.+?[.!?])(?:\s|$)/s);
    if (sentenceMatch && sentenceMatch[1].length <= 140) return sentenceMatch[1].trim();
    const cut = rawTitle.slice(0, 140);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim() + "...";
  }
  return rawTitle;
}
function deskripsiBersih(b) {
  const url = b.content?.url || "";
  const host = hostOf(url);
  const desc = b.content?.description || "";
  if (/instagram\.com/i.test(host)) {
    if (/^\d[\d,.]*\s*likes?,\s*\d[\d,.]*\s*comments?\s*-\s*/i.test(desc)) return b.summary || "";
  }
  return desc || b.summary || "";
}
function cardImage(b) {
  const c = b.content || {};
  if (c.type === "asset" && c.assetId) return "/api/assets/" + c.assetId;
  if (c.imageAssetId) return "/api/assets/" + c.imageAssetId;
  if (c.screenshotAssetId) return "/api/assets/" + c.screenshotAssetId;
  if (c.imageUrl) return c.imageUrl;
  return null;
}
function cardSource(b) {
  const c = b.content || {};
  if (c.type === "link") return hostOf(c.url) || "Link";
  if (c.type === "asset") return "Gambar";
  if (c.type === "text") return "Catatan";
  return "";
}
function jenisKelas(b) {
  const t = b.content?.type;
  if (t === "asset") return "image";
  if (t === "text") return "note";
  return "link";
}
function isManualList(l) {
  return (l.type || "manual") !== "smart";
}

/* API */
async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (r.status === 401) { tampilkanLogin(); throw new Error("unauthorized"); }
  if (!r.ok) {
    const error = new Error("HTTP " + r.status);
    error.status = r.status;
    throw error;
  }
  return r;
}
async function apiJson(path, opts) {
  const r = await api(path, opts);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
const asArray = (data, key) => (Array.isArray(data) ? data : data[key] || []);

/* Toast dengan jendela Urungkan 8 detik */
let toastTimer = null;
let toastUndoFn = null;
function toast(msg, undoFn) {
  const el = $("#toast");
  $("#toast-text").textContent = msg;
  const undoBtn = $("#toast-undo");
  toastUndoFn = undoFn || null;
  undoBtn.hidden = !undoFn;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; toastUndoFn = null; }, undoFn ? 8000 : 3000);
}
$("#toast-undo").addEventListener("click", () => {
  clearTimeout(toastTimer);
  $("#toast").hidden = true;
  const fn = toastUndoFn;
  toastUndoFn = null;
  if (fn) fn();
});

/* Hapus tertunda: aksi API baru jalan sesudah jendela urungkan lewat.
   Selama jendela itu, UI sudah maju dan Urungkan memulihkan tampilan. */
function hapusTertunda(pesan, jalankan, pulihkan) {
  toast(pesan, () => { if (pulihkan) pulihkan(); });
  clearTimeout(hapusTertunda._t);
  hapusTertunda._t = setTimeout(async () => {
    $("#toast").hidden = true;
    toastUndoFn = null;
    try { await jalankan(); } catch { /* pesan gagal sudah ditangani pemanggil */ }
  }, 8000);
}

/* Lembar bawah generik */
let sheetAfterClose = null;
function bukaLembar(judul, bodyHtml, onRendered) {
  $("#sheet-title").textContent = judul;
  $("#sheet-body").innerHTML = bodyHtml;
  $("#sheet").hidden = false;
  if (onRendered) onRendered($("#sheet-body"));
}
function tutupLembar() {
  $("#sheet").hidden = true;
  $("#sheet-body").innerHTML = "";
  state.suppressClick = false;
  if (sheetAfterClose) {
    const fn = sheetAfterClose;
    sheetAfterClose = null;
    fn();
  }
}
$("#sheet-close").addEventListener("click", tutupLembar);
$("#sheet-backdrop").addEventListener("click", tutupLembar);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#sheet").hidden) tutupLembar();
});

/* Navigasi lima menu */
const MENU_VIEWS = ["kantong", "koleksi", "tambah", "cari", "atur"];
function go(view) {
  state.currentView = view;
  ["kantong", "koleksi", "tambah", "cari", "atur", "detail-koleksi", "detail-simpanan", "arsip"].forEach((v) => {
    const el = $("#view-" + v);
    if (el) el.hidden = v !== view;
  });
  document.querySelectorAll(".navbtn").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === view));
  if (MENU_VIEWS.includes(view)) window.scrollTo(0, 0);
  if (view === "kantong") muatKantong();
  if (view === "koleksi") muatKoleksi();
  if (view === "cari") muatCariAwal();
  if (view === "atur") muatAtur();
}
function tampilkanLogin() {
  $("#app").hidden = true;
  $("#screen-login").hidden = false;
}
function tampilkanApp() {
  $("#app").hidden = false;
  $("#screen-login").hidden = true;
}

/* Pil antrean dan lencana: satu sumber dari hitungan Kantong */
function pillHTML() {
  const n = state.kantongCount;
  return n > 0
    ? '<button class="pill notif attn" type="button" id="pill-kantong">' + n + " di Kantong</button>"
    : '<button class="pill green notif" type="button" id="pill-kantong">Kantong rapi</button>';
}
function perbaruiPil() {
  const html = '<div class="logo-lockup">' + logoSVG(37) + '<span class="logo-word" style="font-size:24px;">pocil</span></div>' + pillHTML();
  ["topbar-koleksi", "topbar-tambah", "topbar-cari"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
  document.querySelectorAll("#pill-kantong").forEach((p) =>
    p.addEventListener("click", () => go("kantong")));
  const badge = document.querySelector("[data-badge]");
  if (badge) {
    if (state.kantongCount > 0) {
      badge.hidden = false;
      badge.textContent = state.kantongCount;
    } else {
      badge.hidden = true;
    }
  }
}

/* Kantong: hitungan dan isi dari server, dengan snapshot luring */
function kantongCacheKey() {
  return state.me && state.me.id ? `pocil-kantong-cache:${state.me.id}` : null;
}
async function muatKantong() {
  const cacheKey = kantongCacheKey();
  try { localStorage.removeItem("pocil-kantong-cache"); } catch { /* kunci versi lama */ }
  try {
    const data = await apiJson("/api/kantong");
    state.kantongItems = asArray(data, "items");
    state.kantongCount = data.count ?? state.kantongItems.length;
    state.kantongOffline = false;
    try {
      if (!cacheKey) throw new Error("Akun belum diketahui");
      localStorage.setItem(cacheKey, JSON.stringify({
        count: state.kantongCount,
        items: state.kantongItems.slice(0, 50),
        at: Date.now(),
      }));
    } catch { /* penyimpanan lokal penuh, abaikan */ }
  } catch {
    try {
      const cached = cacheKey ? JSON.parse(localStorage.getItem(cacheKey) || "null") : null;
      if (cached) {
        state.kantongItems = cached.items || [];
        state.kantongCount = cached.count || 0;
        state.kantongOffline = true;
      }
    } catch { /* tanpa snapshot, tampilkan kosong */ }
  }
  perbaruiPil();
  renderKantong();
}
function renderKantong() {
  const wrap = $("#kantong-items");
  const items = state.kantongItems;
  const offlineNote = state.kantongOffline
    ? '<p class="page-sub">Menampilkan simpanan terakhir yang tersimpan (luring). Sambungkan internet untuk memperbarui.</p>'
    : "";
  wrap.innerHTML = offlineNote + (items.map((b) => miniCard(b)).join("") || `
    <div class="empty-state">
      <p>Kantong rapi. Simpanan baru akan menunggu di sini.</p>
    </div>`);
  bindMiniCards(wrap, "kantong");
  const btn = $("#btn-beresin");
  btn.disabled = items.length === 0;
  btn.textContent = items.length > 0 ? `Beresin Kantong (${items.length})` : "Beresin Kantong";
}
function miniCard(b) {
  const img = cardImage(b);
  const jenis = jenisKelas(b);
  const preview = img
    ? `<img loading="lazy" src="${esc(img)}" alt="">`
    : `<span>${esc(judulBersih(b).slice(0, 24))}</span>`;
  const tags = (b.tags || []).slice(0, 3).map((t) =>
    `<span class="tag-chip">#${esc(t.name)}</span>`).join("");
  return `
    <button class="mini" data-bookmark="${esc(b.id)}">
      <div class="mini-preview ${jenis}">${preview}</div>
      <div class="mini-body">
        <span class="mini-title">${esc(judulBersih(b))}</span>
        <span class="mini-meta">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</span>
        ${tags}
      </div>
    </button>`;
}
function bindMiniCards(container, asal) {
  container.querySelectorAll("[data-bookmark]").forEach((el) => {
    el.addEventListener("click", () => {
      bukaDetailSimpanan(el.dataset.bookmark, { view: asal });
    });
  });
}

/* Keanggotaan: daftar list manual yang memuat satu simpanan */
async function resolveBookmarkLists(bookmarkId, forceRefresh = false) {
  if (!forceRefresh && state.membershipCache.has(bookmarkId)) {
    return state.membershipCache.get(bookmarkId);
  }
  if (!state.lists.length) {
    const ld = await apiJson("/api/lists");
    state.lists = asArray(ld, "lists");
  }
  const manual = state.lists.filter(isManualList);
  const results = await Promise.all(manual.map(async (l) => {
    const d = await apiJson(`/api/lists/${l.id}/bookmarks?limit=100`);
    return asArray(d, "bookmarks").some((x) => x.id === bookmarkId) ? l : null;
  }));
  const found = results.filter(Boolean);
  state.membershipCache.set(bookmarkId, found);
  return found;
}

/* Kolaborator satu list, di-cache selama sesi */
async function getCollaborators(listId, forceRefresh = false) {
  if (!forceRefresh && state.collaboratorsCache.has(listId)) {
    return state.collaboratorsCache.get(listId);
  }
  try {
    const data = await apiJson(`/api/lists/${listId}/collaborators`);
    state.collaboratorsCache.set(listId, data);
    return data;
  } catch {
    return null;
  }
}
async function isSharedList(list) {
  const data = await getCollaborators(list.id);
  if (!data) return false;
  const collabs = data.collaborators || [];
  if (collabs.length > 0) return true;
  if (data.owner && state.me && state.me.karakeep_user_id) {
    return data.owner.id !== state.me.karakeep_user_id;
  }
  return false;
}

/* Koleksi: Pustakaku dan Terakhir Disimpan */
async function muatKoleksi() {
  try {
    const listsData = await apiJson("/api/lists");
    state.lists = asArray(listsData, "lists");
  } catch { /* biarkan daftar lama tampil */ }
  renderPustaka();
  try {
    const bmsData = await apiJson("/api/bookmarks?limit=12");
    const bms = asArray(bmsData, "bookmarks");
    const wrap = $("#terakhir-list");
    wrap.innerHTML = bms.slice(0, 6).map((b) => miniCard(b)).join("") || `
      <div class="empty-state"><p>Belum ada simpanan.</p></div>`;
    bindMiniCards(wrap, "koleksi");
  } catch { /* abaikan */ }
  perbaruiPil();
}
async function renderPustaka() {
  const wrap = $("#pustaka-list");
  const manual = state.lists.filter(isManualList);
  if (manual.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><p>Belum ada koleksi. Buat yang pertama dari Beresin Kantong atau dari lembar kelola.</p></div>`;
    return;
  }
  const counts = {};
  await Promise.all(manual.map(async (l) => {
    try {
      const d = await apiJson(`/api/lists/${l.id}/bookmarks?limit=100`);
      const n = asArray(d, "bookmarks").length;
      counts[l.id] = d && d.nextCursor ? `${n}+` : `${n}`;
    } catch { counts[l.id] = null; }
  }));
  const sharedFlags = {};
  await Promise.all(manual.map(async (l) => {
    sharedFlags[l.id] = await isSharedList(l);
  }));
  wrap.innerHTML = manual.map((l) => {
    const countText = counts[l.id] != null ? `${counts[l.id]} simpanan` : "Koleksi";
    return `
      <div class="kol-row">
        <button type="button" class="kol-rowbtn" data-list="${esc(l.id)}">
          <span>
            <span class="kol-name">${esc(l.name)}${sharedFlags[l.id] ? ' <span class="shared-ic" role="img" aria-label="Koleksi bersama">' + groupSVG() + "</span>" : ""}</span>
            <span class="kol-meta">${countText}${sharedFlags[l.id] ? " · dibagikan" : ""}</span>
          </span>
        </button>
        <button type="button" class="vmenu" data-vmenu="${esc(l.id)}" aria-label="Kelola koleksi">${icon("dots")}</button>
      </div>`;
  }).join("");
  bindKolRows(wrap);
}
function bindKolRows(container) {
  container.querySelectorAll(".kol-rowbtn").forEach((btn) => {
    const listId = btn.dataset.list;
    let timer = null;
    let startX = 0, startY = 0;
    let didLongPress = false;
    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
    btn.addEventListener("pointerdown", (e) => {
      didLongPress = false;
      startX = e.clientX; startY = e.clientY;
      clear();
      timer = setTimeout(() => {
        didLongPress = true;
        if (navigator.vibrate) try { navigator.vibrate(10); } catch {}
        const list = state.lists.find((l) => l.id === listId);
        if (list) bukaLembarKelola(list, "koleksi");
      }, 600);
    });
    btn.addEventListener("pointermove", (e) => {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) clear();
    });
    btn.addEventListener("pointerup", clear);
    btn.addEventListener("pointercancel", clear);
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      clear();
      didLongPress = true;
      const list = state.lists.find((l) => l.id === listId);
      if (list) bukaLembarKelola(list, "koleksi");
    });
    btn.addEventListener("click", () => {
      if (didLongPress || state.suppressClick) return;
      bukaDetailKoleksi(listId);
    });
  });
  container.querySelectorAll("[data-vmenu]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const list = state.lists.find((l) => l.id === btn.dataset.vmenu);
      if (list) bukaLembarKelola(list, "koleksi");
    });
  });
}

/* Lembar kelola: satu lembar yang sama dari tahan lama maupun titik tiga */
function bukaLembarKelola(list, asal) {
  state.koleksiScroll = window.scrollY;
  sheetAfterClose = () => {
    window.scrollTo(0, state.koleksiScroll);
    if (asal === "koleksi") muatKoleksi();
    if (asal === "detail") bukaDetailKoleksi(list.id, true);
  };
  const html = `
    <div class="sheet-menu-list">
      <button class="sheet-menu-item" id="kelola-ubah-nama">${icon("pencil")}<span>Ubah Nama</span></button>
      <button class="sheet-menu-item" id="kelola-bagikan">${icon("group")}<span>Bagikan</span></button>
      <button class="sheet-menu-item danger" id="kelola-hapus">${icon("trash")}<span>Hapus</span></button>
    </div>`;
  bukaLembar(list.name, html, (body) => {
    body.querySelector("#kelola-ubah-nama").onclick = () => {
      const formHtml = `
        <form id="form-ubah-nama">
          <div class="sheet-form-group">
            <label class="sheet-label" for="input-ubah-nama">Nama koleksi</label>
            <input class="input" id="input-ubah-nama" type="text" maxlength="60" value="${esc(list.name)}" required autocomplete="off">
          </div>
          <button type="submit" class="btn-primary" style="width:100%">Simpan</button>
        </form>`;
      bukaLembar("Ubah Nama", formHtml, (fBody) => {
        const inp = fBody.querySelector("#input-ubah-nama");
        setTimeout(() => inp.focus(), 100);
        fBody.querySelector("#form-ubah-nama").onsubmit = async (e) => {
          e.preventDefault();
          const name = inp.value.trim();
          if (!name) return;
          try {
            await api(`/api/lists/${list.id}`, { method: "PATCH", body: JSON.stringify({ name }) });
            toast("Koleksi diperbarui");
            tutupLembar();
          } catch { toast("Gagal mengubah nama"); }
        };
      });
    };
    body.querySelector("#kelola-bagikan").onclick = () => bukaSubmenuBagikan(list);
    body.querySelector("#kelola-hapus").onclick = () => {
      const confirmHtml = `
        <div style="padding:4px 0 8px">
          <p style="font-size:14px;line-height:1.5;margin-bottom:18px">
            Simpanan di dalam koleksi <strong>${esc(list.name)}</strong> tidak ikut terhapus, hanya keluar dari koleksi ini.
          </p>
          <button class="btn-danger" id="btn-konfirmasi-hapus" style="margin-bottom:8px">Ya, Hapus Koleksi</button>
          <button class="btn-secondary" id="btn-batal-hapus" style="width:100%">Batal</button>
        </div>`;
      bukaLembar("Hapus " + list.name + "?", confirmHtml, (cBody) => {
        cBody.querySelector("#btn-batal-hapus").onclick = tutupLembar;
        cBody.querySelector("#btn-konfirmasi-hapus").onclick = () => {
          const idx = state.lists.findIndex((l) => l.id === list.id);
          const removed = idx >= 0 ? state.lists.splice(idx, 1)[0] : null;
          tutupLembar();
          renderPustaka();
          hapusTertunda(
            "Koleksi dihapus",
            async () => {
              try { await api(`/api/lists/${list.id}`, { method: "DELETE" }); }
              catch { toast("Gagal menghapus koleksi"); }
              muatKoleksi();
            },
            () => {
              if (removed && idx >= 0) state.lists.splice(idx, 0, removed);
              renderPustaka();
            }
          );
        };
      });
    };
  });
}

async function bukaSubmenuBagikan(list) {
  const data = await getCollaborators(list.id, true);
  const owner = data ? data.owner : null;
  const members = data ? (data.collaborators || []) : [];
  const memberRows = members.map((m) => `
    <div class="device-row" style="margin-bottom:10px">
      <div style="flex:1">
        <span class="dev-name">${esc(m.user.name)}</span>
        <span class="dev-meta">${esc(m.user.email || "")} · ${m.role === "editor" ? "Editor" : "Penonton"} · ${m.status === "pending" ? "undangan menunggu" : "sudah bergabung"}</span>
      </div>
      <select class="input" style="width:auto;min-height:44px" data-role-change="${esc(m.userId)}">
        <option value="viewer" ${m.role === "viewer" ? "selected" : ""}>Penonton</option>
        <option value="editor" ${m.role === "editor" ? "selected" : ""}>Editor</option>
      </select>
      <button class="btn-small" type="button" data-remove-member="${esc(m.userId)}">Keluarkan</button>
    </div>`).join("");
  const html = `
    <div style="margin-bottom:16px">
      ${owner ? `<p style="font-size:13px;color:var(--muted);margin:0 0 10px">Pemilik: ${esc(owner.name)}</p>` : ""}
      ${memberRows || `<p style="font-size:13px;color:var(--muted)">Belum ada anggota.</p>`}
    </div>
    <form id="form-undang">
      <div class="sheet-form-group">
        <label class="sheet-label" for="input-undang-email">Email anggota baru</label>
        <input class="input" id="input-undang-email" type="email" placeholder="nama@email.com" required autocomplete="off">
      </div>
      <div class="sheet-form-group">
        <label class="sheet-label" for="select-undang-peran">Peran</label>
        <select class="input" id="select-undang-peran">
          <option value="editor">Editor</option>
          <option value="viewer">Penonton</option>
        </select>
      </div>
      <button type="submit" class="btn-primary" style="width:100%">Undang</button>
    </form>
    <p style="font-size:12px;color:var(--muted);margin-top:10px">Penonton hanya melihat isi. Editor boleh mengkategorikan simpanan ke koleksi ini.</p>`;
  bukaLembar("Bagikan " + list.name, html, (body) => {
    body.querySelectorAll("[data-role-change]").forEach((sel) => {
      sel.onchange = async () => {
        try {
          await api(`/api/lists/${list.id}/collaborators/${sel.dataset.roleChange}`, {
            method: "PATCH", body: JSON.stringify({ role: sel.value }),
          });
          state.collaboratorsCache.delete(list.id);
          toast("Peran diubah");
        } catch { toast("Gagal mengubah peran"); }
      };
    });
    body.querySelectorAll("[data-remove-member]").forEach((btn) => {
      btn.onclick = async () => {
        try {
          await api(`/api/lists/${list.id}/collaborators/${btn.dataset.removeMember}`, { method: "DELETE" });
          state.collaboratorsCache.delete(list.id);
          toast("Anggota dikeluarkan");
          bukaSubmenuBagikan(list);
        } catch { toast("Gagal mengeluarkan anggota"); }
      };
    });
    body.querySelector("#form-undang").onsubmit = async (e) => {
      e.preventDefault();
      const email = body.querySelector("#input-undang-email").value.trim();
      const role = body.querySelector("#select-undang-peran").value;
      if (!email) return;
      try {
        await api(`/api/lists/${list.id}/collaborators`, {
          method: "POST", body: JSON.stringify({ email, role }),
        });
        state.collaboratorsCache.delete(list.id);
        toast("Undangan koleksi dikirim");
        bukaSubmenuBagikan(list);
      } catch { toast("Gagal mengundang, periksa emailnya"); }
    };
  });
}

/* Detail koleksi dengan tiga tampilan */
async function bukaDetailKoleksi(listId, keepScroll = false) {
  state.currentListId = listId;
  const list = state.lists.find((l) => l.id === listId);
  state.detailReturn = { view: "koleksi" };
  go("detail-koleksi");
  const wrap = $("#detail-koleksi-wrap");
  wrap.innerHTML = `<div class="empty-state"><p>Memuat koleksi...</p></div>`;
  try {
    const data = await apiJson(`/api/lists/${listId}/bookmarks?limit=100`);
    state.collectionItems = asArray(data, "bookmarks");
  } catch {
    state.collectionItems = [];
  }
  const shared = list ? await isSharedList(list) : false;
  const name = list ? list.name : "Koleksi";
  wrap.innerHTML = `
    <button class="btn-back" id="detail-koleksi-back" type="button">‹ Kembali</button>
    <div style="display:flex;align-items:center;gap:8px">
      <h1 class="page-title" style="flex:1">${esc(name)}</h1>
      <button type="button" class="vmenu" id="detail-koleksi-vmenu" aria-label="Kelola koleksi">${icon("dots")}</button>
    </div>
    <p class="page-sub">${state.collectionItems.length} simpanan${shared ? " · dibagikan" : ""}${shared ? ' <span class="shared-ic" role="img" aria-label="Koleksi bersama">' + groupSVG() + "</span>" : ""}</p>
    <div class="view-switch" role="group" aria-label="Tampilan isi koleksi">
      <button type="button" class="switchbtn ${state.viewMode === "list" ? "active" : ""}" data-viewmode="list" aria-label="Tampilan daftar">${icon("list")}</button>
      <button type="button" class="switchbtn ${state.viewMode === "tile" ? "active" : ""}" data-viewmode="tile" aria-label="Tampilan ubin">${icon("grid")}</button>
      <button type="button" class="switchbtn ${state.viewMode === "legacy" ? "active" : ""}" data-viewmode="legacy" aria-label="Tampilan versi lama">${icon("card")}</button>
    </div>
    <div id="detail-koleksi-items"></div>`;
  $("#detail-koleksi-back").onclick = () => go("koleksi");
  $("#detail-koleksi-vmenu").onclick = () => {
    if (list) bukaLembarKelola(list, "detail");
  };
  wrap.querySelectorAll("[data-viewmode]").forEach((btn) => {
    btn.onclick = () => {
      state.viewMode = btn.dataset.viewmode;
      renderDetailKoleksiItems();
      wrap.querySelectorAll("[data-viewmode]").forEach((b) =>
        b.classList.toggle("active", b.dataset.viewmode === state.viewMode));
    };
  });
  renderDetailKoleksiItems();
  if (keepScroll) window.scrollTo(0, state.koleksiScroll);
}
function renderDetailKoleksiItems() {
  const wrap = $("#detail-koleksi-items");
  if (!wrap) return;
  const items = state.collectionItems;
  if (items.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><p>Koleksi ini masih kosong.</p></div>`;
    return;
  }
  if (state.viewMode === "tile") {
    wrap.innerHTML = `<div class="tile-grid">${items.map((b) => {
      const img = cardImage(b);
      const jenis = jenisKelas(b);
      const photo = img ? `<img loading="lazy" src="${esc(img)}" alt="">` : `<span>${esc(judulBersih(b).slice(0, 24))}</span>`;
      return `<button class="tile" data-bookmark="${esc(b.id)}">
        <div class="tile-photo ${jenis}">${photo}</div>
        <span class="tile-title">${esc(judulBersih(b))}</span>
        <span class="tile-meta">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</span>
      </button>`;
    }).join("")}</div>`;
  } else if (state.viewMode === "legacy") {
    wrap.innerHTML = `<div class="legacy-grid">${items.map((b) => {
      const img = cardImage(b);
      const firstTag = (b.tags || [])[0];
      const photo = img ? `<img loading="lazy" src="${esc(img)}" alt="">` : `<span>${esc(judulBersih(b).slice(0, 40))}</span>`;
      return `<button class="legacy-card" data-bookmark="${esc(b.id)}">
        <div class="legacy-photo">${photo}${firstTag ? `<span class="legacy-chip">#${esc(firstTag.name)}</span>` : ""}</div>
        <span class="legacy-title">${esc(judulBersih(b))}</span>
        <span class="legacy-meta">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</span>
      </button>`;
    }).join("")}</div>`;
  } else {
    wrap.innerHTML = items.map((b) => `
      <button class="row-item" data-bookmark="${esc(b.id)}">
        <span class="row-item-title">${esc(judulBersih(b))}</span>
        <span class="row-item-meta">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</span>
      </button>`).join("");
  }
  wrap.querySelectorAll("[data-bookmark]").forEach((el) => {
    el.addEventListener("click", () => {
      bukaDetailSimpanan(el.dataset.bookmark, { view: "detail-koleksi", listId: state.currentListId });
    });
  });
}

/* Beresin Kantong: layar penuh, satu kartu, kategori wajib */
function bukaBeresin() {
  if (state.kantongItems.length === 0) {
    toast("Kantong rapi, tidak ada yang dibereskan");
    return;
  }
  state.focusQueue = [...state.kantongItems];
  state.focusIndex = 0;
  $("#focuslay").hidden = false;
  document.body.classList.add("focus-open");
  renderFocus();
}
function tutupBeresin() {
  $("#focuslay").hidden = true;
  document.body.classList.remove("focus-open");
  $("#toast").hidden = true;
  muatKantong();
  go("koleksi");
}
$("#focus-x").addEventListener("click", tutupBeresin);

async function renderFocus() {
  const segs = $("#focus-segs");
  const body = $("#focus-body");
  const q = state.focusQueue;
  segs.innerHTML = q.map((_, i) => `<i class="${i <= state.focusIndex ? "done" : ""}"></i>`).join("");
  if (state.focusIndex >= q.length || q.length === 0) {
    body.innerHTML = `
      <div class="beres">
        <h2>Beres!</h2>
        <p>Kantong kosong. Beresin Kantong menyapa lagi saat ada simpanan baru.</p>
        <button class="btn-primary" id="beres-ke-koleksi" type="button">Buka Koleksi</button>
      </div>`;
    $("#beres-ke-koleksi").onclick = tutupBeresin;
    return;
  }
  const b = q[state.focusIndex];
  const c = b.content || {};
  const img = cardImage(b);
  const descClean = deskripsiBersih(b);
  const tags = (b.tags || []).slice(0, 3).map((t) =>
    `<span class="tag-chip">#${esc(t.name)}</span>`).join("");
  const manual = state.lists.filter(isManualList);
  const sharedFlags = {};
  await Promise.all(manual.map(async (l) => { sharedFlags[l.id] = await isSharedList(l); }));
  const editorFlags = {};
  await Promise.all(manual.map(async (l) => {
    editorFlags[l.id] = true;
    if (!sharedFlags[l.id]) return;
    const data = await getCollaborators(l.id);
    if (!data) return;
    const meId = state.me ? state.me.karakeep_user_id : null;
    const mine = (data.collaborators || []).find((m) => m.userId === meId);
    const isOwner = data.owner && meId && data.owner.id === meId;
    if (!isOwner && mine && mine.role !== "editor") editorFlags[l.id] = false;
  }));
  body.innerHTML = `
    <div class="fcardbox">
      <div class="fcard">
        <p class="fcard-source">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</p>
        ${img ? `<div class="fcard-photo"><img src="${esc(img)}" alt=""></div>` : ""}
        <h3 class="fcard-title">${esc(judulBersih(b))}</h3>
        ${descClean ? `<p class="fcard-desc">${esc(descClean.slice(0, 200))}</p>` : ""}
        ${tags ? `<div style="margin-top:10px">${tags}</div>` : ""}
      </div>
      <div class="fpick">
        <p class="fpick-label">Pilih satu koleksi untuk simpanan ini:</p>
        ${manual.map((l) => `
          <button class="fpick-btn" type="button" data-pilih="${esc(l.id)}" ${editorFlags[l.id] ? "" : "disabled"}>
            ${icon("folder")}
            <span>${esc(l.name)}${sharedFlags[l.id] ? ' <span class="shared-ic" role="img" aria-label="Koleksi bersama">' + groupSVG() + "</span>" : ""}</span>
            ${editorFlags[l.id] ? "" : '<span style="margin-left:auto;font-size:12px;color:var(--muted)">Penonton</span>'}
          </button>`).join("") || `<p style="font-size:13px;color:var(--muted)">Belum ada koleksi. Buat satu di bawah.</p>`}
        <button class="fpick-btn" type="button" id="fpick-baru">＋ Kategori baru</button>
        <div id="fpick-baru-form" hidden>
          <form id="form-kategori-baru" style="display:flex;gap:8px">
            <input class="input" id="input-kategori-baru" type="text" placeholder="Nama kategori" required autocomplete="off" style="flex:1">
            <button class="btn-primary" type="submit">Buat dan masukkan</button>
          </form>
        </div>
      </div>
      <div class="frow-act">
        <button class="btn-buang" type="button" id="focus-buang">${icon("trash")}<span>Buang</span></button>
      </div>
    </div>`;
  body.querySelectorAll("[data-pilih]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        const result = await apiJson(`/api/kantong/${b.id}/categorize`, {
          method: "POST", body: JSON.stringify({ listId: btn.dataset.pilih }),
        });
        state.membershipCache.delete(b.id);
        state.focusIndex += 1;
        state.kantongItems = state.kantongItems.filter((x) => x.id !== b.id);
        state.kantongCount = state.kantongItems.length;
        perbaruiPil();
        if (result.remaining_in && result.remaining_in.length) {
          toast("Masuk koleksi, tapi masih tertaut ke koleksi lain");
        }
        renderFocus();
      } catch { toast("Gagal mengkategorikan, coba lagi"); }
    };
  });
  const baruBtn = body.querySelector("#fpick-baru");
  baruBtn.onclick = () => {
    body.querySelector("#fpick-baru-form").hidden = false;
    body.querySelector("#input-kategori-baru").focus();
  };
  body.querySelector("#form-kategori-baru").onsubmit = async (e) => {
    e.preventDefault();
    const name = body.querySelector("#input-kategori-baru").value.trim();
    if (!name) return;
    try {
      const r = await api("/api/lists", { method: "POST", body: JSON.stringify({ name }) });
      const created = await r.json();
      const listId = created.id || created.list?.id;
      if (listId) {
        state.lists.push(created.list || created);
        const result = await apiJson(`/api/kantong/${b.id}/categorize`, {
          method: "POST", body: JSON.stringify({ listId }),
        });
        toast(result.remaining_in && result.remaining_in.length
          ? `Masuk ke ${name}, tapi masih tertaut ke koleksi lain`
          : `Masuk ke ${name}`);
      }
      state.membershipCache.delete(b.id);
      state.focusIndex += 1;
      state.kantongItems = state.kantongItems.filter((x) => x.id !== b.id);
      state.kantongCount = state.kantongItems.length;
      perbaruiPil();
      renderFocus();
    } catch { toast("Gagal membuat kategori"); }
  };
  body.querySelector("#focus-buang").onclick = () => {
    const idx = state.focusIndex;
    const removed = state.focusQueue.splice(idx, 1)[0];
    state.kantongItems = state.kantongItems.filter((x) => x.id !== removed.id);
    state.kantongCount = state.kantongItems.length;
    perbaruiPil();
    renderFocus();
    hapusTertunda(
      "Simpanan dibuang",
      async () => {
        try { await api(`/api/bookmarks/${removed.id}`, { method: "DELETE" }); }
        catch { toast("Gagal membuang simpanan"); }
        muatKantong();
      },
      () => {
        state.focusQueue.splice(idx, 0, removed);
        state.kantongItems.unshift(removed);
        state.kantongCount = state.kantongItems.length;
        state.focusIndex = idx;
        perbaruiPil();
        renderFocus();
      }
    );
  };
}

/* Detail simpanan: satu baris empat ikon */
async function bukaDetailSimpanan(id, ret) {
  state.detailReturn = ret || { view: "koleksi" };
  go("detail-simpanan");
  const wrap = $("#detail-simpanan-wrap");
  wrap.innerHTML = `<div class="empty-state"><p>Memuat detail...</p></div>`;
  let b;
  try {
    b = await apiJson("/api/bookmarks/" + id);
  } catch {
    wrap.innerHTML = `<div class="empty-state"><p>Gagal memuat simpanan.</p></div>`;
    return;
  }
  let containing;
  try {
    containing = await resolveBookmarkLists(id);
  } catch {
    wrap.innerHTML = `<div class="empty-state"><p>Gagal memuat keanggotaan koleksi. Coba lagi sebelum mengubah simpanan.</p></div>`;
    return;
  }
  const parentList = containing[0] || null;
  const c = b.content || {};
  const img = cardImage(b);
  const urlText = c.url || "";
  const displayUrl = urlText.replace(/^https?:\/\/(www\.)?/, "");
  const tagsHtml = (b.tags || []).map((t) => `
    <span class="tag-chip">#${esc(t.name)}
      <button data-del-tag="${esc(t.name)}" aria-label="Hapus tag" style="border:none;background:none;font-weight:800;cursor:pointer;padding:0 0 0 4px">×</button>
    </span>`).join("");
  wrap.innerHTML = `
    <button class="btn-back" id="detail-back" type="button">‹ Kembali</button>
    ${img ? `<img class="detail-photo" src="${esc(img)}" alt="">` : ""}
    <div style="display:flex;gap:8px;align-items:flex-start">
      <h1 class="detail-title" id="detail-title-text" style="flex:1">${esc(judulBersih(b, true))}</h1>
      <button class="btn-small" id="detail-pencil" type="button" aria-label="Edit Judul">${icon("pencil")}</button>
    </div>
    <div id="detail-title-editor" hidden>
      <input class="input" id="detail-title-input" type="text" value="${esc(b.title || c.title || "")}">
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn-secondary" id="detail-title-cancel" type="button">Batal</button>
        <button class="btn-primary" id="detail-title-save" type="button">Simpan</button>
      </div>
    </div>
    <p class="detail-meta">${esc(parentList ? parentList.name : "Tanpa koleksi")} · ${esc(formatDateTime(b.createdAt))}${b.archived ? " · diarsipkan" : ""}</p>
    ${c.type === "link" ? `
      <a class="btn-primary" href="${esc(c.url)}" target="_blank" rel="noopener" style="width:100%;text-decoration:none;margin-bottom:12px">
        <span>Buka link</span>
        <span style="font-weight:500;font-size:12px">${esc(displayUrl)}</span>
      </a>` : ""}
    <div class="action-row">
      <button class="action-btn" type="button" id="daction-pindah">${icon("move")}<span>Pindah</span></button>
      <button class="action-btn" type="button" id="daction-arsip">${icon("archive")}<span>${b.archived ? "Batal Arsip" : "Arsip"}</span></button>
      <button class="action-btn" type="button" id="daction-sumber">${icon("open")}<span>Sumber</span></button>
      <button class="action-btn danger" type="button" id="daction-buang">${icon("trash")}<span>Buang</span></button>
    </div>
    <div class="detail-section">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Tag</h3>
        <button class="btn-small" id="btn-show-add-tag" type="button">＋ Tambah</button>
      </div>
      <div id="add-tag-form-wrap" hidden style="margin:10px 0">
        <div style="display:flex;gap:8px">
          <input type="text" id="new-tag-input" class="input" placeholder="Nama tag..." style="flex:1">
          <button class="btn-primary" id="new-tag-save" type="button">Simpan</button>
        </div>
      </div>
      <div>${tagsHtml || `<p style="font-size:13px;color:var(--muted)">Belum ada tag. Tag AI muncul sendiri sesudah crawl selesai.</p>`}</div>
    </div>
    <div class="detail-section">
      <h3>Catatan</h3>
      <textarea id="detail-note-input" class="detail-note" placeholder="Ketuk untuk menambah catatan...">${esc(b.note || "")}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:8px">
        <button class="btn-secondary" id="detail-note-save" type="button">Simpan Catatan</button>
      </div>
    </div>
    ${b.summary ? `<div class="detail-section"><h3>Ringkasan AI</h3><p>${esc(b.summary)}</p></div>` : ""}
    ${c.description ? `<div class="detail-section"><h3>Deskripsi</h3><p>${esc(c.description)}</p></div>` : ""}
    ${c.type === "text" ? `<div class="detail-section"><p style="white-space:pre-wrap">${esc(c.text || "")}</p></div>` : ""}`;

  $("#detail-back").onclick = kembaliDariDetail;
  const titleTextEl = $("#detail-title-text");
  const editorEl = $("#detail-title-editor");
  $("#detail-pencil").onclick = () => {
    editorEl.hidden = false;
    titleTextEl.hidden = true;
    $("#detail-title-input").focus();
  };
  $("#detail-title-cancel").onclick = () => {
    editorEl.hidden = true;
    titleTextEl.hidden = false;
  };
  $("#detail-title-save").onclick = async () => {
    const newTitle = $("#detail-title-input").value.trim();
    if (!newTitle) return;
    try {
      await api(`/api/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify({ title: newTitle }) });
      titleTextEl.textContent = newTitle;
      editorEl.hidden = true;
      titleTextEl.hidden = false;
      toast("Judul diperbarui");
    } catch { toast("Gagal mengubah judul"); }
  };

  const handlePindah = () => {
    const currentId = parentList ? parentList.id : "";
    const listsHtml = `
      <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0 16px">
        ${state.lists.filter(isManualList).map((l) => `
          <label class="sheet-menu-item" style="cursor:pointer">
            <input type="radio" name="move_dest" value="${l.id}" ${l.id === currentId ? "checked" : ""}>
            <span>${esc(l.name)}</span>
          </label>`).join("")}
      </div>`;
    bukaLembar("Pindahkan Simpanan", listsHtml, (mBody) => {
      mBody.querySelectorAll("input[name=move_dest]").forEach((radio) => {
        radio.onchange = async () => {
          const destId = radio.value;
          if (destId === currentId) { tutupLembar(); return; }
          tutupLembar();
          try {
            await api(`/api/kantong/${id}/categorize`, {
              method: "POST", body: JSON.stringify({ listId: destId }),
            });
            const destList = state.lists.find((l) => l.id === destId);
            toast(`Dipindahkan ke ${destList ? destList.name : "Koleksi"}`);
            if (b.archived) {
              await api("/api/bookmarks/" + id, { method: "PATCH", body: JSON.stringify({ archived: false }) });
              b.archived = false;
            }
            state.membershipCache.delete(id);
            bukaDetailSimpanan(id, ret);
          } catch { toast("Gagal memindahkan"); }
        };
      });
    });
  };
  $("#daction-pindah").onclick = handlePindah;

  $("#daction-arsip").onclick = async () => {
    try {
      if (!b.archived) {
        for (const l of containing) {
          await api(`/api/lists/${l.id}/bookmarks/${id}`, { method: "DELETE" });
        }
        await api("/api/bookmarks/" + id, { method: "PATCH", body: JSON.stringify({ archived: true }) });
        toast("Diarsipkan dan dikeluarkan dari semua koleksi");
      } else {
        await api("/api/bookmarks/" + id, { method: "PATCH", body: JSON.stringify({ archived: false }) });
        toast("Dikeluarkan dari arsip ke Kantong");
      }
      state.membershipCache.delete(id);
      kembaliDariDetail();
      muatKantong();
    } catch { toast("Gagal mengubah arsip"); }
  };

  $("#daction-sumber").onclick = () => {
    if (c.type === "link" && c.url) window.open(c.url, "_blank");
    else toast("Simpanan ini tidak punya sumber tautan");
  };

  $("#daction-buang").onclick = () => {
    kembaliDariDetail();
    hapusTertunda(
      "Simpanan dibuang",
      async () => {
        try { await api(`/api/bookmarks/${id}`, { method: "DELETE" }); }
        catch { toast("Gagal membuang simpanan"); }
        muatKantong();
      },
      () => { bukaDetailSimpanan(id, ret); }
    );
  };

  const addTagForm = $("#add-tag-form-wrap");
  $("#btn-show-add-tag").onclick = () => {
    addTagForm.hidden = !addTagForm.hidden;
    if (!addTagForm.hidden) $("#new-tag-input").focus();
  };
  $("#new-tag-save").onclick = async () => {
    const tagName = $("#new-tag-input").value.trim().replace(/^#/, "");
    if (!tagName) return;
    const currentTags = (b.tags || []).map((t) => t.name);
    if (!currentTags.includes(tagName)) currentTags.push(tagName);
    try {
      await api(`/api/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify({ tags: currentTags }) });
      toast("Tag ditambahkan");
      bukaDetailSimpanan(id, ret);
    } catch { toast("Gagal menambah tag"); }
  };
  wrap.querySelectorAll("[data-del-tag]").forEach((btn) => {
    btn.onclick = async () => {
      const delName = btn.dataset.delTag;
      const updatedTags = (b.tags || []).map((t) => t.name).filter((n) => n !== delName);
      try {
        await api(`/api/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify({ tags: updatedTags }) });
        toast("Tag dilepas");
        bukaDetailSimpanan(id, ret);
      } catch { toast("Gagal melepas tag"); }
    };
  });
  $("#detail-note-save").onclick = async () => {
    try {
      await api(`/api/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify({ note: $("#detail-note-input").value }) });
      toast("Catatan disimpan");
    } catch { toast("Gagal menyimpan catatan"); }
  };
}
function kembaliDariDetail() {
  const ret = state.detailReturn || { view: "koleksi" };
  if (ret.view === "detail-koleksi" && ret.listId) {
    bukaDetailKoleksi(ret.listId, true);
  } else if (ret.view === "cari") {
    go("cari");
  } else if (ret.view === "kantong") {
    go("kantong");
  } else if (ret.view === "arsip") {
    bukaArsip();
  } else {
    go("koleksi");
  }
}

/* Cari: satu kotak, kata kunci dan hasil bertahan saat kembali */
let cariDebounce = null;
async function muatCariAwal() {
  const input = $("#cari-input");
  if (input.value !== state.searchQ) input.value = state.searchQ;
  if (state.searchResults.length > 0 || state.searchQ || state.searchTag) {
    renderCariHasil();
    return;
  }
  try {
    const tagsData = await apiJson("/api/tags");
    state.tags = asArray(tagsData, "tags");
  } catch { state.tags = []; }
  renderCariChips();
  $("#cari-hasil").innerHTML = `<div class="empty-state"><p>Ketik kata kunci atau pilih tag untuk mulai mencari.</p></div>`;
}
function renderCariChips() {
  const wrap = $("#cari-chips");
  wrap.innerHTML = `<div class="chip-row">${state.tags.slice(0, 20).map((t) =>
    `<button class="fchip ${state.searchTag === t.name ? "active" : ""}" type="button" data-chip-tag="${esc(t.name)}" data-chip-id="${esc(t.id)}">#${esc(t.name)}</button>`).join("")}</div>`;
  wrap.querySelectorAll("[data-chip-tag]").forEach((btn) => {
    btn.onclick = () => {
      if (state.searchTag === btn.dataset.chipTag) {
        state.searchTag = null; state.searchTagId = null;
      } else {
        state.searchTag = btn.dataset.chipTag; state.searchTagId = btn.dataset.chipId;
      }
      jalankanCari();
    };
  });
}
async function jalankanCari() {
  const q = state.searchQ;
  const wrap = $("#cari-hasil");
  renderCariChips();
  if (!q.trim() && !state.searchTag) {
    state.searchResults = [];
    wrap.innerHTML = `<div class="empty-state"><p>Ketik kata kunci atau pilih tag untuk mulai mencari.</p></div>`;
    return;
  }
  wrap.innerHTML = `<div class="empty-state"><p>Mencari...</p></div>`;
  try {
    let items = [];
    if (!q.trim() && state.searchTagId) {
      const data = await apiJson(`/api/tags/${state.searchTagId}/bookmarks?limit=24`);
      items = asArray(data, "bookmarks");
    } else {
      const data = await apiJson("/api/bookmarks/search?q=" + encodeURIComponent(q) + "&limit=24");
      items = asArray(data, "bookmarks");
      if (state.searchTag) {
        items = items.filter((b) => (b.tags || []).some((t) => t.name === state.searchTag));
      }
    }
    state.searchResults = items;
    renderCariHasil();
  } catch {
    wrap.innerHTML = `<div class="empty-state"><p>Gagal mencari. Periksa koneksimu, lalu coba lagi.</p></div>`;
  }
}
function renderCariHasil() {
  const wrap = $("#cari-hasil");
  renderCariChips();
  const items = state.searchResults;
  wrap.innerHTML = items.map((b) => miniCard(b)).join("") || `
    <div class="empty-state"><p>Tidak ada hasil untuk "${esc(state.searchQ)}".</p></div>`;
  bindMiniCards(wrap, "cari");
}
$("#cari-input").addEventListener("input", (e) => {
  state.searchQ = e.target.value;
  clearTimeout(cariDebounce);
  cariDebounce = setTimeout(jalankanCari, 220);
});

/* Tambah: tiga jenis, semua lewat endpoint gabungan, semua ke Kantong */
$("#form-tambah-link").addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = $("#tambah-link-url").value.trim();
  if (!url) return;
  try {
    await api("/api/capture", { method: "POST", body: JSON.stringify({ url }) });
    $("#tambah-link-url").value = "";
    toast("Tersimpan ke Kantong");
    muatKantong();
  } catch { toast("Gagal menyimpan, periksa link-nya"); }
});
$("#form-tambah-catatan").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("#tambah-catatan-teks").value.trim();
  if (!text) return;
  try {
    await api("/api/capture", { method: "POST", body: JSON.stringify({ text }) });
    $("#tambah-catatan-teks").value = "";
    toast("Tersimpan ke Kantong");
    muatKantong();
  } catch { toast("Gagal menyimpan catatan"); }
});
$("#form-tambah-gambar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = $("#tambah-gambar-file");
  if (!fileInput.files || fileInput.files.length === 0) return;
  const form = new FormData();
  form.append("file", fileInput.files[0]);
  try {
    const r = await fetch("/api/capture", { method: "POST", body: form });
    if (!r.ok) throw new Error("HTTP " + r.status);
    fileInput.value = "";
    toast("Tersimpan ke Kantong");
    muatKantong();
  } catch { toast("Gagal menyimpan gambar"); }
});

/* Arsip: di luar Beresin Kantong */
async function bukaArsip() {
  state.detailReturn = { view: "koleksi" };
  go("arsip");
  const wrap = $("#arsip-items");
  wrap.innerHTML = `<div class="empty-state"><p>Memuat arsip...</p></div>`;
  try {
    const data = await apiJson("/api/bookmarks?archived=true&limit=50");
    const items = asArray(data, "bookmarks");
    wrap.innerHTML = items.map((b) => miniCard(b)).join("") || `
      <div class="empty-state"><p>Belum ada simpanan yang diarsipkan.</p></div>`;
    bindMiniCards(wrap, "arsip");
  } catch {
    wrap.innerHTML = `<div class="empty-state"><p>Gagal memuat arsip.</p></div>`;
  }
}
$("#btn-open-arsip").addEventListener("click", bukaArsip);
$("#arsip-back").addEventListener("click", () => go("koleksi"));
$("#btn-beresin").addEventListener("click", bukaBeresin);
document.querySelectorAll(".navbtn").forEach((el) =>
  el.addEventListener("click", () => go(el.dataset.view)));

/* Atur: grup baris Akun, Preferensi, Data, Terhubung, Bantuan, Admin */
async function muatAtur() {
  const wrap = $("#atur-groups");
  const me = state.me;
  if (!me) return;
  const isAdmin = me.is_admin;
  let devicesHtml = `<p style="font-size:13px;color:var(--muted)">Memuat perangkat...</p>`;
  let adminHtml = "";
  wrap.innerHTML = `
    <div class="set-group">
      <h2 class="set-group-title">Akun</h2>
      <button class="set-row" type="button" id="atur-profil">
        ${me.picture ? `<img src="${esc(me.picture)}" alt="" style="width:32px;height:32px;object-fit:cover;border:2px solid var(--line);border-radius:8px;flex:none">` : `<span class="set-ic">${icon("pencil")}</span>`}
        <span>${esc(me.name)}</span>
        <span class="set-val">${me.role === "owner" ? "Admin" : "Anggota"} · ${esc(me.email)}</span>
        <span class="chev">›</span>
      </button>
      <button class="set-row" type="button" id="atur-perangkat">
        <span class="set-ic">${icon("link")}</span>
        <span>Perangkat dan Pairing</span>
        <span class="set-val">Shortcut dan PWA</span>
        <span class="chev">›</span>
      </button>
      <div id="atur-perangkat-list" hidden>${devicesHtml}</div>
    </div>
    <div class="set-group">
      <h2 class="set-group-title">Preferensi</h2>
      <div class="set-row" style="cursor:default">
        <span class="set-ic">${icon("refresh")}</span>
        <span>Tema</span>
        <span class="theme-switch">
          <button type="button" data-theme-choice="light" aria-label="Tema terang">☀</button>
          <button type="button" data-theme-choice="dark" aria-label="Tema gelap">☾</button>
        </span>
      </div>
      ${isAdmin ? `
      <div class="set-row" style="cursor:default">
        <span class="set-ic">${icon("archive")}</span>
        <span>Pengingat Telegram</span>
        <label class="switch">
          <input type="checkbox" id="switch-pengingat" ${me.reminder_enabled ? "checked" : ""}>
          <span class="switch-track"></span>
        </label>
      </div>
      <p style="font-size:12px;color:var(--muted);margin:-4px 0 0">Default nonaktif. Pengingat hanya untuk pemilik, soal Kantong yang belum diproses.</p>` : ""}
    </div>
    <div class="set-group">
      <h2 class="set-group-title">Data</h2>
      <button class="set-row" type="button" id="atur-impor">
        <span class="set-ic">${icon("upload")}</span>
        <span>Impor Simpanan</span>
        <span class="chev">›</span>
      </button>
      <button class="set-row" type="button" id="atur-ekspor">
        <span class="set-ic">${icon("download")}</span>
        <span>Ekspor dan Cadangan</span>
        <span class="chev">›</span>
      </button>
      ${isAdmin ? `
      <button class="set-row" type="button" id="atur-segarkan-tag">
        <span class="set-ic">${icon("refresh")}</span>
        <span>Segarkan Tag AI</span>
        <span class="set-val">Pemicu massal</span>
        <span class="chev">›</span>
      </button>` : ""}
    </div>
    <div class="set-group">
      <h2 class="set-group-title">Bantuan</h2>
      <button class="set-row" type="button" id="atur-tentang">
        <span class="set-ic ic-cream">${icon("note")}</span>
        <span>Tentang Pocil</span>
        <span class="chev">›</span>
      </button>
      <button class="set-row" type="button" id="atur-privasi">
        <span class="set-ic ic-cream">${icon("note")}</span>
        <span>Kebijakan Privasi</span>
        <span class="chev">›</span>
      </button>
    </div>
    ${isAdmin ? `<div class="set-group" id="atur-admin-group">
      <h2 class="set-group-title">Admin</h2>
      <button class="set-row" type="button" id="atur-undang">
        <span class="set-ic">${icon("group")}</span>
        <span>Undang Anggota</span>
        <span class="chev">›</span>
      </button>
      <div id="atur-anggota-list"><p style="font-size:13px;color:var(--muted)">Memuat anggota...</p></div>
    </div>` : ""}
    <p style="font-size:12px;color:var(--muted)">Status mesin: ${me.karakeep_connected ? "terhubung" : "belum terhubung, periksa kunci di server"}</p>`;
  terapkanTema(localStorage.getItem("pocil-theme") || "system");
  wrap.querySelectorAll(".theme-switch button").forEach((b) =>
    b.addEventListener("click", () => {
      localStorage.setItem("pocil-theme", b.dataset.themeChoice);
      terapkanTema(b.dataset.themeChoice);
    }));
  const switchPengingat = wrap.querySelector("#switch-pengingat");
  if (switchPengingat) {
    switchPengingat.addEventListener("change", async () => {
      const enabled = switchPengingat.checked;
      try {
        const updated = await apiJson("/api/me/reminder", {
          method: "PATCH", body: JSON.stringify({ enabled }),
        });
        state.me = updated;
        toast(enabled ? "Pengingat diaktifkan" : "Pengingat dinonaktifkan");
      } catch (e) {
        switchPengingat.checked = false;
        toast("Akun Telegram belum terhubung, hubungkan dulu sebelum menyalakan pengingat");
      }
    });
  }
  wrap.querySelector("#atur-profil").onclick = () => {
    const html = `
      <form id="form-profil">
        <div class="sheet-form-group">
          <label class="sheet-label" for="input-profil-nama">Nama tampilan</label>
          <input class="input" id="input-profil-nama" type="text" maxlength="80" value="${esc(me.name)}" required autocomplete="off">
        </div>
        <div class="sheet-form-group">
          <label class="sheet-label" for="input-profil-foto">Foto (opsional, maks 256 KB)</label>
          <input class="input-file" id="input-profil-foto" type="file" accept="image/*">
        </div>
        <button type="submit" class="btn-primary" style="width:100%">Simpan Profil</button>
      </form>`;
    bukaLembar("Profil", html, (body) => {
      body.querySelector("#form-profil").onsubmit = async (e) => {
        e.preventDefault();
        const name = body.querySelector("#input-profil-nama").value.trim();
        const fileInput = body.querySelector("#input-profil-foto");
        const payload = { name };
        if (fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file.size > 256000) { toast("Foto terlalu besar, maks 256 KB"); return; }
          payload.picture = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }
        try {
          const updated = await apiJson("/api/me", { method: "PATCH", body: JSON.stringify(payload) });
          state.me = updated;
          toast("Profil disimpan");
          tutupLembar();
          muatAtur();
        } catch { toast("Gagal menyimpan profil"); }
      };
    });
  };
  wrap.querySelector("#atur-perangkat").onclick = async () => {
    const listWrap = wrap.querySelector("#atur-perangkat-list");
    listWrap.hidden = !listWrap.hidden;
    if (listWrap.hidden) return;
    listWrap.innerHTML = `<p style="font-size:13px;color:var(--muted)">Memuat perangkat...</p>`;
    try {
      const data = await apiJson("/api/devices");
      const devices = asArray(data, "devices");
      listWrap.innerHTML = `
        <div style="margin-bottom:12px">
          ${devices.map((d) => `
            <div class="device-row" style="margin-bottom:10px">
              <div style="flex:1">
                <span class="dev-name">${esc(d.device_name)}</span>
                <span class="dev-meta">${d.revoked_at ? "dicabut" : "aktif"}${d.last_used_at ? " · terakhir dipakai " + esc(timeAgo(d.last_used_at)) : ""}</span>
              </div>
              ${d.revoked_at ? "" : `<button class="btn-small" type="button" data-cabut="${esc(d.id)}">Cabut</button>`}
            </div>`).join("") || `<p style="font-size:13px;color:var(--muted)">Belum ada perangkat terpairing.</p>`}
        </div>
        <button class="btn-primary" type="button" id="btn-tambah-perangkat" style="width:100%">Tambah Perangkat</button>
        <p style="font-size:12px;color:var(--muted)">Satu akun bisa punya beberapa perangkat. Token tiap perangkat bisa dicabut satu per satu dari sini.</p>`;
      listWrap.querySelectorAll("[data-cabut]").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await api(`/api/devices/${btn.dataset.cabut}`, { method: "DELETE" });
            toast("Perangkat dicabut, tokennya tidak bisa lagi mengirim");
            wrap.querySelector("#atur-perangkat").click();
            wrap.querySelector("#atur-perangkat").click();
          } catch { toast("Gagal mencabut perangkat"); }
        };
      });
      listWrap.querySelector("#btn-tambah-perangkat").onclick = () => {
        const html = `
          <form id="form-pairing">
            <div class="sheet-form-group">
              <label class="sheet-label" for="input-nama-perangkat">Nama perangkat</label>
              <input class="input" id="input-nama-perangkat" type="text" placeholder="misal: iPhone Azzam" required autocomplete="off">
            </div>
            <button type="submit" class="btn-primary" style="width:100%">Minta Kode Pairing</button>
          </form>
          <div id="pairing-hasil" hidden>
            <p style="font-size:13px;margin:14px 0 0">Masukkan kode ini ke Shortcut sekali saja. Shortcut menyimpan tokennya sendiri, kamu tidak pernah mengetik token.</p>
            <div class="pairing-code" id="pairing-kode"></div>
            <p style="font-size:12px;color:var(--muted)">Kode berlaku 10 menit dan hanya bisa dipakai sekali.</p>
          </div>`;
        bukaLembar("Tambah Perangkat", html, (body) => {
          body.querySelector("#form-pairing").onsubmit = async (e) => {
            e.preventDefault();
            const deviceName = body.querySelector("#input-nama-perangkat").value.trim();
            if (!deviceName) return;
            try {
              const data = await apiJson("/api/pairing/code", {
                method: "POST", body: JSON.stringify({ device_name: deviceName }),
              });
              body.querySelector("#pairing-kode").textContent = data.code;
              body.querySelector("#pairing-hasil").hidden = false;
            } catch { toast("Gagal meminta kode pairing"); }
          };
        });
      };
    } catch {
      listWrap.innerHTML = `<p style="font-size:13px;color:var(--muted)">Gagal memuat perangkat.</p>`;
    }
  };
  wrap.querySelector("#atur-impor").onclick = () => {
    const html = `
      <form id="form-impor">
        <div class="sheet-form-group">
          <label class="sheet-label" for="input-impor-file">Berkas ekspor JSON Pocil</label>
          <input class="input-file" id="input-impor-file" type="file" accept="application/json" required>
        </div>
        <button type="submit" class="btn-primary" style="width:100%">Impor</button>
      </form>
      <p style="font-size:12px;color:var(--muted)">Impor membuat simpanan tautan dan catatan baru di Kantong. Gambar di dalam berkas dilewati.</p>`;
    bukaLembar("Impor Simpanan", html, (body) => {
      body.querySelector("#form-impor").onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = body.querySelector("#input-impor-file");
        if (!fileInput.files || fileInput.files.length === 0) return;
        try {
          const text = await fileInput.files[0].text();
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : (parsed.bookmarks || []);
          let dibuat = 0, dilewati = 0;
          for (const item of list) {
            const url = item.url || item.content?.url;
            const teks = item.text || item.content?.text;
            try {
              if (url) { await api("/api/capture", { method: "POST", body: JSON.stringify({ url }) }); dibuat += 1; }
              else if (teks) { await api("/api/capture", { method: "POST", body: JSON.stringify({ text: teks }) }); dibuat += 1; }
              else { dilewati += 1; }
            } catch { dilewati += 1; }
          }
          tutupLembar();
          toast(`Impor selesai: ${dibuat} dibuat, ${dilewati} dilewati`);
          muatKantong();
        } catch { toast("Berkas tidak bisa dibaca sebagai JSON"); }
      };
    });
  };
  wrap.querySelector("#atur-ekspor").onclick = async () => {
    try {
      let items = [];
      let cursor = null;
      for (let page = 0; page < 50; page += 1) {
        const q = "/api/bookmarks?limit=100" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
        const data = await apiJson(q);
        items = items.concat(asArray(data, "bookmarks"));
        cursor = data.nextCursor || null;
        if (!cursor) break;
      }
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), bookmarks: items }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pocil-ekspor.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Ekspor diunduh");
    } catch { toast("Gagal mengekspor"); }
  };
  const segarkanBtn = wrap.querySelector("#atur-segarkan-tag");
  if (segarkanBtn) {
    segarkanBtn.onclick = async () => {
      try {
        await apiJson("/api/admin/retrigger-inference", {
          method: "POST", body: JSON.stringify({ status: "all" }),
        });
        toast("Penandaan ulang dipicu, tag muncul bertahap sesudah proses latar selesai");
      } catch { toast("Gagal memicu penandaan ulang"); }
    };
  }
  wrap.querySelector("#atur-tentang").onclick = () => {
    bukaLembar("Tentang Pocil", `
      <p style="font-size:14px;line-height:1.6">Pocil adalah kantong simpanan pribadi di homelab. Semua simpanan baru mendarat di Kantong, lalu kamu pilihkan satu koleksi lewat Beresin Kantong. Mesin penyimpanan di belakang layar adalah Karakeep, tetapi kamu tidak pernah melihat antarmukanya.</p>
      <p style="font-size:13px;color:var(--muted)">Versi reset 24 Okt 2026.</p>`);
  };
  wrap.querySelector("#atur-privasi").onclick = () => {
    bukaLembar("Kebijakan Privasi", `
      <p style="font-size:14px;line-height:1.6">Data simpanan tinggal di server homelab pemilik, bukan di layanan pihak ketiga. Login Google hanya dipakai untuk mengenali email kamu; Pocil tidak membaca email atau data Google lainnya. Token perangkat hanya hidup di perangkat itu dan bisa dicabut kapan saja dari Pengaturan.</p>`);
  };
  if (isAdmin) {
    const anggotaWrap = wrap.querySelector("#atur-anggota-list");
    try {
      const data = await apiJson("/api/admin/members");
      const members = asArray(data, "members");
      const invitations = asArray(data, "invitations");
      const pending = invitations.filter((i) => i.status === "pending");
      anggotaWrap.innerHTML = `
        ${members.map((m) => `
          <div class="device-row" style="margin-bottom:10px">
            <div style="flex:1">
              <span class="dev-name">${esc(m.name)}</span>
              <span class="dev-meta">${esc(m.email)} · ${m.role === "owner" ? "Admin" : "Anggota"}</span>
            </div>
          </div>`).join("")}
        ${pending.map((i) => `
          <div class="device-row" style="margin-bottom:10px">
            <div style="flex:1">
              <span class="dev-name">${esc(i.email)}</span>
              <span class="dev-meta">Undangan menunggu</span>
            </div>
            <button class="btn-small" type="button" data-cabut-undangan="${esc(i.id)}">Cabut</button>
          </div>`).join("")}`;
      anggotaWrap.querySelectorAll("[data-cabut-undangan]").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await api(`/api/invitations/${btn.dataset.cabutUndangan}`, { method: "DELETE" });
            toast("Undangan dicabut");
            muatAtur();
          } catch { toast("Gagal mencabut undangan"); }
        };
      });
    } catch {
      anggotaWrap.innerHTML = `<p style="font-size:13px;color:var(--muted)">Gagal memuat anggota.</p>`;
    }
    wrap.querySelector("#atur-undang").onclick = () => {
      const html = `
        <form id="form-undang-anggota">
          <div class="sheet-form-group">
            <label class="sheet-label" for="input-undang-anggota">Email anggota baru</label>
            <input class="input" id="input-undang-anggota" type="email" placeholder="nama@email.com" required autocomplete="off">
          </div>
          <button type="submit" class="btn-primary" style="width:100%">Undang</button>
        </form>
        <p style="font-size:12px;color:var(--muted)">Undangan email adalah satu-satunya jalan masuk anggota. Sesudah diundang, anggota masuk lewat Google dan akun mesinnya dibuat otomatis.</p>`;
      bukaLembar("Undang Anggota", html, (body) => {
        body.querySelector("#form-undang-anggota").onsubmit = async (e) => {
          e.preventDefault();
          const email = body.querySelector("#input-undang-anggota").value.trim();
          if (!email) return;
          try {
            await api("/api/invitations", { method: "POST", body: JSON.stringify({ email }) });
            toast("Undangan dibuat, anggota bisa masuk lewat Google");
            tutupLembar();
            muatAtur();
          } catch { toast("Gagal mengundang, periksa emailnya"); }
        };
      });
    };
  }
}

/* Keluar */
$("#btn-logout").addEventListener("click", async () => {
  await fetch("/auth/logout", { method: "POST" }).catch(() => {});
  const cacheKey = kantongCacheKey();
  if (cacheKey) {
    try { localStorage.removeItem(cacheKey); } catch { /* abaikan */ }
  }
  state.me = null;
  state.kantongItems = [];
  state.kantongCount = 0;
  tampilkanLogin();
});

/* Mulai */
(async function init() {
  initTema();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  try {
    const cfg = await (await fetch("/auth/config")).json();
    if (!cfg.google) {
      const btn = $("#btn-google-login");
      btn.textContent = "Login Google belum disetel di server";
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.5";
    }
  } catch { /* abaikan */ }
  const params = new URLSearchParams(location.search);
  const err = params.get("error");
  const viewParam = params.get("view");
  if (err || viewParam) history.replaceState(null, "", location.pathname);
  if (err) {
    const el = $("#login-error");
    el.hidden = false;
    el.textContent =
      err === "email-tidak-diundang" ? "Email Google itu belum diundang ke Pocil."
      : err === "provisioning-gagal" ? "Akun mesin gagal dibuat, minta admin mencoba lagi."
      : err === "harus-masuk" ? "Masuk dulu sebelum berbagi dari aplikasi lain."
      : err === "email-tidak-terverifikasi" ? "Email Google itu belum terverifikasi."
      : err === "simpan-gagal" ? "Simpanan gagal masuk ke Pocil. Coba kirim ulang."
      : "Login Google gagal, coba lagi.";
  }
  try {
    state.me = await apiJson("/auth/me");
    tampilkanApp();
    await muatKantong();
    if (viewParam === "kantong") {
      go("kantong");
      return;
    }
    if (!state.greeted && state.kantongCount > 0) {
      state.greeted = true;
      go("koleksi");
      try {
        const listsData = await apiJson("/api/lists");
        state.lists = asArray(listsData, "lists");
      } catch { /* antrean tetap bisa dibuka tanpa daftar */ }
      bukaBeresin();
    } else {
      go("koleksi");
    }
  } catch {
    tampilkanLogin();
  }
})();
