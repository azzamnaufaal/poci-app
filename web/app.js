"use strict";
/* Poci - frontend. Semua data dibaca dari Karakeep lewat server perantara
   (/api/...), API key tidak pernah ada di sisi browser. */

const $ = (sel) => document.querySelector(sel);

// Palet warna pastel-jenuh untuk tab folder dan ubin ikon (hanya aksen kecil)
const FOLDER_COLORS = ["#FE6A73", "#B6DE48", "#FED264", "#9AD1F5", "#F6A6D7", "#FFC38A", "#A8E6B8", "#C9B8F5"];
const TAG_COLORS = ["#FED264", "#B6DE48", "#F6A6D7", "#9AD1F5", "#FFC38A", "#A8E6B8", "#FE6A73", "#C9B8F5"];

// 16 Swatch warna untuk Sheet Koleksi Baru (Tugas 2)
const SWATCH_COLORS = [
  "#F56476", "#FED264", "#B6DE48", "#7FB6D9",
  "#C3A6E8", "#F2A65A", "#8FD0C5", "#E88BB0",
  "#5DA85F", "#E4572E", "#4C7DD9", "#9BC53D",
  "#F9C784", "#B08968", "#6C757D", "#2F2A24",
];

const state = {
  lists: [],
  tags: [],
  libraryCursor: null,
  currentListId: null,
  collectionItems: [],
  isSelecting: false,
  selectedBookmarks: new Set(),
  focusQueue: [],
  focusIndex: 0,
  focusListId: null,
  isSwipeMode: false,
  swipeTitle: "",
  hideRecrawlSession: false,
  totalBookmarks: 0,
  favouriteCount: 0,
};

/* ---------------- 24 Ikon Koleksi SVG (Tugas 2) ---------------- */
const ICON_SVGS = {
  folder: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  star: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  heart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  music: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  camera: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  flag: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  moon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  cloud: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
  key: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9m-1.5-1.5L2 12a6 6 0 1 0 8.5 8.5l9.5-9.5V2h-5z"/></svg>`,
  calendar: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  globe: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  gift: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  leaf: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 21 2c-1.5 5-2 6.5-3.1 12.2A7 7 0 0 1 11 20z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>`,
  briefcase: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  cart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  plane: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.9-.2-1.8.3-2.1 1.2-.3.9.1 1.9.9 2.3l6.5 3.9-3.7 3.7-2.7-.4c-.5-.1-1 .1-1.3.5l-.2.3c-.4.5-.3 1.2.2 1.6l2.8 2.3 2.3 2.8c.4.5 1.1.6 1.6.2l.3-.2c.4-.3.6-.8.5-1.3l-.4-2.7 3.7-3.7 3.9 6.5c.4.8 1.4 1.2 2.3.9.9-.3 1.4-1.2 1.2-2.1z"/></svg>`,
  car: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="9" width="22" height="9" rx="2"/><path d="M4 9l2-5h12l2 5"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
  coffee: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  film: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
  headphones: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  pin: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
  fork: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v20M18 2a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3M6 2v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2M9 11v11"/></svg>`,
};

/* ---------------- Ikon UI Antarmuka ---------------- */
const ICONS = {
  arrowLeft: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  arrowRight: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  collection: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  bookmark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  pinned: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
  tag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  archive: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`,
  trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  move: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  pencil: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  mascot: `<svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="poci-mascot"><path d="M10 20h28v14a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V20Z"/><path d="M14 20c0-6 4-10 10-10s10 4 10 10"/><circle cx="24" cy="7" r="2" fill="currentColor"/><path d="M38 24h4a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-4"/><path d="M10 26l-6-4v-2l6 2"/><circle cx="20" cy="28" r="1.5" fill="currentColor"/><circle cx="28" cy="28" r="1.5" fill="currentColor"/><path d="M22 33c1 1 3 1 4 0"/></svg>`,
};

/* ---------------- Peta Kunci Ikon ke Emoji (Tugas A) ---------------- */
const ICON_EMOJIS = {
  folder: "📁",
  star: "⭐",
  heart: "❤️",
  book: "📚",
  music: "🎵",
  camera: "📷",
  flag: "🚩",
  moon: "🌙",
  sun: "☀️",
  cloud: "☁️",
  key: "🔑",
  calendar: "📅",
  globe: "🌐",
  gift: "🎁",
  leaf: "🍃",
  briefcase: "💼",
  cart: "🛒",
  plane: "✈️",
  car: "🚗",
  coffee: "☕",
  film: "🎬",
  headphones: "🎧",
  pin: "📌",
  fork: "🍴",
};

function buildListDescription(existingDesc, iconKey, colorHex) {
  const pociLine = `poci:${iconKey}:${colorHex}`;
  if (!existingDesc || !existingDesc.trim()) {
    return pociLine;
  }
  const lines = existingDesc.split("\n");
  const firstLine = lines[0].trim();
  // Baris poci: menggantikan baris pertama HANYA bila baris pertama lama juga berawalan poci:
  // atau berformat skema lama (kunci:#hex)
  if (firstLine.startsWith("poci:") || (firstLine.includes(":") && ICON_SVGS[firstLine.split(":")[0]])) {
    lines[0] = pociLine;
    return lines.join("\n");
  }
  return [pociLine, ...lines].join("\n");
}

/* ---------------- Parser Metadata Koleksi (Tugas A & Tugas 2) ---------------- */
function parseListMeta(list, index = 0) {
  // Prioritas 1: baris pertama description berawalan poci: (skema baru)
  if (list && list.description) {
    const firstLine = list.description.split("\n")[0].trim();
    if (firstLine.startsWith("poci:")) {
      const parts = firstLine.split(":");
      if (parts.length >= 3) {
        const k = parts[1];
        const c = parts[2];
        if (ICON_SVGS[k] && c) {
          return { iconKey: k, color: c, svg: ICON_SVGS[k] };
        }
      }
    }
  }
  // Prioritas 2: kolom icon berformat <kunci>:<#hex> (skema lama putaran 2)
  if (list && list.icon && list.icon.includes(":")) {
    const parts = list.icon.split(":");
    const k = parts[0];
    const c = parts[1];
    if (ICON_SVGS[k] && c) {
      return { iconKey: k, color: c, svg: ICON_SVGS[k] };
    }
  }
  // Prioritas 3: tebakan kata kunci nama
  const name = (((list && list.name) || "") + " " + ((list && list.description) || "")).toLowerCase();
  let iconKey = "folder";
  if (/resep|makan|food|kuliner|masak|cook|recipe/i.test(name)) iconKey = "fork";
  else if (/coffee|kopi|minum/i.test(name)) iconKey = "coffee";
  else if (/belanja|shop|beli|store|market|cart|promo|flash/i.test(name)) iconKey = "cart";
  else if (/ide|konten|kreatif|inspirasi|brainstorm|idea/i.test(name)) iconKey = "sun";
  else if (/baca|buku|belajar|read|book|riset|research|study/i.test(name)) iconKey = "book";
  else if (/travel|jalan|wisata|trip|liburan|flight|plane/i.test(name)) iconKey = "plane";
  else if (/music|musik|lagu/i.test(name)) iconKey = "music";
  else if (/film|movie|nonton/i.test(name)) iconKey = "film";

  const color = FOLDER_COLORS[index % FOLDER_COLORS.length];
  return { iconKey, color, svg: ICON_SVGS[iconKey] || ICON_SVGS.folder };
}

/* ---------------- Pembersihan Judul & Deskripsi Media Sosial (Tugas 8) ---------------- */
function judulBersih(b, isDetail = false) {
  const c = b.content || {};
  const rawTitle = String(b.title || c.title || (c.type === "asset" ? c.fileName : null) || c.url || "Tanpa judul").trim();

  // Pola Instagram: Nama Akun on Instagram: "caption..." (tanda kutip lurus atau curly)
  const igMatch = rawTitle.match(/^(.+?)\s+on Instagram:\s*["“](.*?)["”]?$/is);
  if (igMatch) {
    let caption = (igMatch[2] || "").trim();
    if (!caption) return igMatch[1].trim();

    // Potong pada akhir kalimat pertama: . ! ?
    const sentenceMatch = caption.match(/^(.+?[.!?])(?:\s|$)/s);
    if (sentenceMatch) {
      caption = sentenceMatch[1].trim();
    }
    // Bila masih lebih dari 90 karakter, potong di batas kata terakhir sebelum 90
    if (caption.length > 90) {
      const cut = caption.slice(0, 90);
      const lastSpace = cut.lastIndexOf(" ");
      caption = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "...";
    }
    return caption;
  }

  // Judul umum > 140 karakter pada kartu / focus mode
  if (!isDetail && rawTitle.length > 140) {
    const sentenceMatch = rawTitle.match(/^(.+?[.!?])(?:\s|$)/s);
    if (sentenceMatch && sentenceMatch[1].length <= 140) {
      return sentenceMatch[1].trim();
    }
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
    // Bila deskripsi diawali pola angka likes dan komentar
    if (/^\d[\d,.]*\s*likes?,\s*\d[\d,.]*\s*comments?\s*-\s*/i.test(desc)) {
      return b.summary || "";
    }
  }
  return desc || b.summary || "";
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
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const m = monthNames[d.getMonth()] || "";
  const y = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${m} ${y} · ${hh}.${mm}`;
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

// Simpanan baru otomatis masuk antrean Focus Mode (daftar "Belum Dibuka").
// Kegagalan di sini tidak boleh menggagalkan penyimpanan utamanya.
async function masukBelumDibuka(bid) {
  if (!bid) return;
  try {
    const fl = state.lists.find((l) => /belum dibuka/i.test(l.name));
    const fid = state.focusListId || (fl && fl.id);
    if (fid) await api(`/api/lists/${fid}/bookmarks/${bid}`, { method: "PUT" });
  } catch { /* abaikan */ }
}

// Kartu Focus Mode yang dilewati (dibuka atau dilanjut) keluar dari antrean "Belum Dibuka".
async function keluarAntrean(b) {
  if (state.isSwipeMode || !state.focusListId) return;
  await api(`/api/lists/${state.focusListId}/bookmarks/${b.id}`, { method: "DELETE" }).catch(() => {});
}

// Sesudah keluar antrean: bila simpanan tidak punya koleksi lain, pindah ke "Belum Ada Kategori".
async function pindahKeKategoriBilaYatim(b) {
  if (state.isSwipeMode || !state.focusListId) return;
  try {
    const kat = state.lists.find((l) => /belum ada kategori/i.test(l.name));
    if (!kat || kat.id === state.focusListId) return;
    for (const l of state.lists) {
      if (l.id === state.focusListId || l.id === kat.id) continue;
      const d = await apiJson(`/api/lists/${l.id}/bookmarks?limit=100`).catch(() => null);
      if (d && asArray(d, "bookmarks").some((x) => x.id === b.id)) return;
    }
    await api(`/api/lists/${kat.id}/bookmarks/${b.id}`, { method: "PUT" });
  } catch { /* abaikan */ }
}

/* ---------------- Navigasi ---------------- */
const SCREENS = ["home", "library", "search", "detail", "collection", "focus", "settings"];
function showScreen(name) {
  if (state.currentScreen && state.currentScreen !== "detail" && name === "detail") {
    state.detailPreviousScreen = state.currentScreen;
  }
  state.currentScreen = name;
  SCREENS.forEach((s) => { const el = $("#screen-" + s); if (el) el.hidden = s !== name; });
  $("#app").hidden = false;
  $("#screen-login").hidden = true;
  window.scrollTo(0, 0);
}
function showLogin() {
  $("#app").hidden = true;
  $("#screen-login").hidden = false;
}

/* ---------------- Bottom Sheet Generik (Tugas 2, 4, 5, 7) ---------------- */
function showBottomSheet(title, bodyHtml, onRendered) {
  const sheet = $("#bottom-sheet");
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = bodyHtml;
  sheet.hidden = false;
  $("#sheet-close").onclick = closeBottomSheet;
  sheet.onclick = (e) => {
    if (e.target === sheet) closeBottomSheet();
  };
  if (onRendered) onRendered($("#sheet-body"));
}
function closeBottomSheet() {
  const sheet = $("#bottom-sheet");
  sheet.hidden = true;
  $("#sheet-body").innerHTML = "";
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeBottomSheet();
});

/* ---------------- Kartu Simpanan (Ringan & Bersih) ---------------- */
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
function itemCard(b) {
  const img = cardImage(b);
  const firstTag = (b.tags || [])[0];
  const photo = img
    ? `<img loading="lazy" src="${esc(img)}" alt="">`
    : `<div class="no-photo"><span>${esc(judulBersih(b).slice(0, 24))}</span></div>`;
  const chip = firstTag ? `<span class="item-chip">${esc(firstTag.name)}</span>` : "";

  const isSelectable = state.isSelecting;
  const isSelected = state.selectedBookmarks.has(b.id);

  return `
    <button class="item-card ${isSelectable ? "is-selectable" : ""} ${isSelected ? "is-selected" : ""}" data-bookmark="${esc(b.id)}">
      ${isSelectable ? `<span class="card-select-checkbox">${isSelected ? ICONS.check : ""}</span>` : ""}
      <div class="item-photo">${photo}${chip}</div>
      <div class="item-body">
        <span class="item-title">${esc(judulBersih(b))}</span>
        <span class="item-source">${esc(cardSource(b))} · ${esc(timeAgo(b.createdAt))}</span>
      </div>
    </button>`;
}
function bindCards(container) {
  container.querySelectorAll("[data-bookmark]").forEach((el) => {
    el.addEventListener("click", () => {
      const bid = el.dataset.bookmark;
      if (state.isSelecting) {
        if (state.selectedBookmarks.has(bid)) state.selectedBookmarks.delete(bid);
        else state.selectedBookmarks.add(bid);
        renderCollectionGrid();
      } else {
        openDetail(bid);
      }
    });
  });
}

/* ---------------- Beranda (Tugas 1 & 3) ---------------- */
async function loadHome() {
  const listsData = await apiJson("/api/lists");
  state.lists = asArray(listsData, "lists");
  const grid = $("#home-collections");
  const shown = state.lists.slice(0, 6);

  // Jumlah isi tiap koleksi dihitung dari daftarnya langsung (API daftar Karakeep
  // tidak menyediakan numBookmarks, jadi teks "Koleksi" polos bukan pilihan)
  const isiKoleksi = {};
  await Promise.all(shown.map(async (l) => {
    try {
      const d = await apiJson(`/api/lists/${l.id}/bookmarks?limit=100`);
      const n = asArray(d, "bookmarks").length;
      isiKoleksi[l.id] = d && d.nextCursor ? `${n}+` : `${n}`;
    } catch { isiKoleksi[l.id] = null; }
  }));

  grid.innerHTML = shown.map((l, i) => {
    const meta = parseListMeta(l, i);
    const countText = isiKoleksi[l.id] != null ? `${isiKoleksi[l.id]} simpanan` : "Koleksi";
    return `
      <button class="folder-card" data-list="${esc(l.id)}">
        <div class="folder-vector-wrap">
          <svg class="folder-svg" viewBox="0 0 200 152" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="folder-back-path" d="M10 76V14C10 8.48 14.48 4 20 4H76C81 4 85.2 6.7 87.6 10.6L97 23C98.7 25.4 101.2 26 104 26H176C183 26 190 33 190 42V76H10Z" fill="${meta.color}" />
            <path class="folder-flap-path" d="M5 46C5 38.27 11.27 32 19 32H181C188.73 32 195 38.27 195 46L190.5 134C190 141.5 184 147 176.5 147H23.5C16 147 10 141.5 9.5 134L5 46Z" />
          </svg>
          <div class="folder-content">
            <div class="folder-top">
              <span class="folder-tile" style="background:${meta.color}">
                ${meta.svg}
              </span>
              <span class="folder-count">${countText}</span>
            </div>
            <span class="folder-name">${esc(l.name)}</span>
          </div>
        </div>
      </button>`;
  }).join("") || `
    <div class="empty-state">
      ${ICONS.mascot}
      <p>Belum ada koleksi. Buat yang pertama lewat tombol folder di atas.</p>
    </div>`;

  bindFolderCards(grid);

  // Focus Mode antrean "Belum Dibuka" atau simpanan terbaru
  const focusList = state.lists.find((l) => /belum dibuka/i.test(l.name));
  state.focusListId = focusList ? focusList.id : null;
  if (focusList) {
    try {
      const fd = await apiJson(`/api/lists/${focusList.id}/bookmarks?limit=50`);
      $("#review-count").textContent = asArray(fd, "bookmarks").length + " simpanan baru";
    } catch { $("#review-count").textContent = "Simpanan baru"; }
  } else {
    try {
      const fd = await apiJson("/api/bookmarks?limit=10");
      $("#review-count").textContent = asArray(fd, "bookmarks").length + " simpanan terbaru";
    } catch { $("#review-count").textContent = "Simpanan baru"; }
  }
}

/* ---------------- Tahan-Lama & Klik Folder (Tugas 7) ---------------- */
function bindFolderCards(container) {
  container.querySelectorAll(".folder-card").forEach((card) => {
    const listId = card.dataset.list;
    const list = state.lists.find((l) => l.id === listId);
    if (!list) return;

    let timer = null;
    let startX = 0, startY = 0;
    let didLongPress = false;

    const clear = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    card.addEventListener("pointerdown", (e) => {
      didLongPress = false;
      startX = e.clientX;
      startY = e.clientY;
      clear();
      timer = setTimeout(() => {
        didLongPress = true;
        if (navigator.vibrate) try { navigator.vibrate(10); } catch {}
        openFolderContextMenu(list);
      }, 450);
    });

    card.addEventListener("pointermove", (e) => {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
        clear();
      }
    });

    card.addEventListener("pointerup", clear);
    card.addEventListener("pointercancel", clear);

    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      clear();
      didLongPress = true;
      openFolderContextMenu(list);
    });

    card.addEventListener("click", (e) => {
      if (didLongPress) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      openCollection(listId);
    });
  });
}

function openFolderContextMenu(list) {
  const html = `
    <div class="sheet-menu-list">
      <button class="sheet-menu-item" id="menu-edit-folder">
        ${ICONS.pencil} <span>Ubah Nama dan Tampilan</span>
      </button>
      <button class="sheet-menu-item" id="menu-share-folder">
        ${ICONS.share} <span>Bagikan Koleksi</span>
      </button>
      <button class="sheet-menu-item danger" id="menu-delete-folder">
        ${ICONS.trash} <span>Hapus Koleksi</span>
      </button>
    </div>`;

  showBottomSheet(list.name, html, (body) => {
    body.querySelector("#menu-edit-folder").onclick = () => {
      closeBottomSheet();
      openCollectionSheet(list);
    };

    body.querySelector("#menu-share-folder").onclick = async () => {
      closeBottomSheet();
      try {
        await api(`/api/lists/${list.id}`, { method: "PATCH", body: JSON.stringify({ public: true }) });
        const cfg = await apiJson("/api/config");
        const pubBase = (cfg && cfg.karakeep_public_url) || "http://ai-core:3000";
        const shareUrl = `${pubBase.replace(/\/$/, "")}/public/lists/${list.id}`;

        if (navigator.share) {
          try {
            await navigator.share({ title: list.name, url: shareUrl });
            toast("Tautan koleksi dibagikan");
            return;
          } catch {}
        }
        await navigator.clipboard.writeText(shareUrl);
        toast("Tautan koleksi disalin");
      } catch {
        toast("Gagal membagikan koleksi");
      }
    };

    body.querySelector("#menu-delete-folder").onclick = () => {
      const confirmHtml = `
        <div style="padding:4px 0 8px">
          <p style="font-size:14.5px;color:var(--ink);line-height:1.45;margin-bottom:18px">
            Simpanan di dalam koleksi <strong>${esc(list.name)}</strong> tidak akan ikut terhapus, hanya keluar dari koleksi ini.
          </p>
          <button class="btn-danger" id="confirm-delete-folder-btn" style="width:100%;height:46px;margin-bottom:8px">Ya, Hapus Koleksi</button>
          <button class="btn-secondary" id="cancel-delete-folder-btn" style="width:100%;height:44px">Batal</button>
        </div>`;
      showBottomSheet("Hapus " + list.name + "?", confirmHtml, (cBody) => {
        cBody.querySelector("#confirm-delete-folder-btn").onclick = async () => {
          try {
            await api(`/api/lists/${list.id}`, { method: "DELETE" });
            closeBottomSheet();
            toast("Koleksi dihapus");
            loadHome();
          } catch {
            toast("Gagal menghapus koleksi");
          }
        };
        cBody.querySelector("#cancel-delete-folder-btn").onclick = closeBottomSheet;
      });
    };
  });
}

/* ---------------- Sheet Koleksi Baru & Edit (Tugas 2) ---------------- */
function openCollectionSheet(existingList = null) {
  const isEdit = !!existingList;
  const initialMeta = isEdit ? parseListMeta(existingList) : { iconKey: "folder", color: SWATCH_COLORS[0] };
  let selectedColor = initialMeta.color;
  let selectedIcon = initialMeta.iconKey;

  const colorSwatchesHtml = SWATCH_COLORS.map((c) => {
    const isSel = c.toLowerCase() === selectedColor.toLowerCase();
    return `<button type="button" class="swatch-btn ${isSel ? "selected" : ""}" data-color="${c}" style="background:${c}" aria-label="Warna ${c}">
      ${isSel ? `<span class="swatch-check">${ICONS.check}</span>` : ""}
    </button>`;
  }).join("");

  const iconKeys = Object.keys(ICON_SVGS);
  const iconButtonsHtml = iconKeys.map((k) => {
    const isSel = k === selectedIcon;
    return `<button type="button" class="icon-pick-btn ${isSel ? "selected" : ""}" data-icon="${k}" style="${isSel ? `--selected-color:${selectedColor}` : ""}" aria-label="Ikon ${k}">
      ${ICON_SVGS[k]}
    </button>`;
  }).join("");

  const initialName = isEdit ? existingList.name : "";

  const bodyHtml = `
    <form id="col-sheet-form">
      <div class="sheet-form-group">
        <div class="sheet-label-row">
          <label class="sheet-label" for="col-sheet-name">NAMA</label>
          <span class="sheet-char-count" id="col-char-count">${initialName.length}/40</span>
        </div>
        <input class="sheet-input" id="col-sheet-name" type="text" maxlength="40" placeholder="misal: Resep, Inspirasi Desain..." value="${esc(initialName)}" autocomplete="off" required>
      </div>

      <div class="sheet-form-group">
        <div class="sheet-label-row">
          <span class="sheet-label">WARNA</span>
        </div>
        <div class="color-grid" id="col-color-grid">${colorSwatchesHtml}</div>
      </div>

      <div class="sheet-form-group">
        <div class="sheet-label-row">
          <span class="sheet-label">IKON</span>
        </div>
        <div class="icon-grid" id="col-icon-grid">${iconButtonsHtml}</div>
      </div>

      <button type="submit" class="btn-primary btn-sheet-submit" id="col-sheet-submit" ${initialName.trim() ? "" : "disabled"}>
        ${isEdit ? "Simpan" : "Buat koleksi"}
      </button>
    </form>`;

  showBottomSheet(isEdit ? "Ubah Koleksi" : "Koleksi Baru", bodyHtml, (body) => {
    const input = body.querySelector("#col-sheet-name");
    const counter = body.querySelector("#col-char-count");
    const submitBtn = body.querySelector("#col-sheet-submit");

    input.addEventListener("input", () => {
      const len = input.value.length;
      counter.textContent = `${len}/40`;
      submitBtn.disabled = !input.value.trim();
    });

    body.querySelectorAll(".swatch-btn").forEach((btn) => {
      btn.onclick = () => {
        selectedColor = btn.dataset.color;
        body.querySelectorAll(".swatch-btn").forEach((b) => {
          const sel = b === btn;
          b.classList.toggle("selected", sel);
          b.innerHTML = sel ? `<span class="swatch-check">${ICONS.check}</span>` : "";
        });
        const activeIconBtn = body.querySelector(".icon-pick-btn.selected");
        if (activeIconBtn) activeIconBtn.style.setProperty("--selected-color", selectedColor);
      };
    });

    body.querySelectorAll(".icon-pick-btn").forEach((btn) => {
      btn.onclick = () => {
        selectedIcon = btn.dataset.icon;
        body.querySelectorAll(".icon-pick-btn").forEach((b) => {
          const sel = b === btn;
          b.classList.toggle("selected", sel);
          if (sel) b.style.setProperty("--selected-color", selectedColor);
          else b.style.removeProperty("--selected-color");
        });
      };
    });

    body.querySelector("#col-sheet-form").onsubmit = async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;

      const emoji = ICON_EMOJIS[selectedIcon] || "📁";

      try {
        if (isEdit) {
          const desc = buildListDescription(existingList.description, selectedIcon, selectedColor);
          await api(`/api/lists/${existingList.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name, icon: emoji, description: desc }),
          });
          toast("Koleksi diperbarui");
        } else {
          const desc = `poci:${selectedIcon}:${selectedColor}`;
          await api("/api/lists", {
            method: "POST",
            body: JSON.stringify({ name, icon: emoji, description: desc }),
          });
          toast("Koleksi dibuat");
        }
        closeBottomSheet();
        loadHome();
        if (isEdit && state.currentListId === existingList.id) {
          openCollection(existingList.id);
        }
      } catch {
        toast("Gagal menyimpan koleksi");
      }
    };
  });
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
  state.totalBookmarks = data.total ?? items.length;

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
    el.addEventListener("click", () => {
      showScreen("search");
      $("#search-input").value = el.dataset.tag;
      runSearch(el.dataset.tag);
    }));
}

/* ---------------- Pencarian (Tugas 6) ---------------- */
async function openSearch() {
  showScreen("search");
  const input = $("#search-input");
  input.value = "";
  $("#search-initial").hidden = false;
  $("#search-results").hidden = true;
  input.focus();

  // Muat data awal Pustakaku, Terakhir Disimpan, dan Tag Populer
  try {
    const [listsData, bmsData, tagsData] = await Promise.all([
      apiJson("/api/lists"),
      apiJson("/api/bookmarks?limit=12"),
      apiJson("/api/tags"),
    ]);
    state.lists = asArray(listsData, "lists");
    state.tags = asArray(tagsData, "tags");
    const bms = asArray(bmsData, "bookmarks");
    const totalBms = bmsData.total ?? bms.length;
    const favCount = bms.filter((b) => b.favourite).length;

    $("#search-stats-panel").innerHTML = `
      <div class="stat-card">
        <span class="stat-icon">${ICONS.collection}</span>
        <b class="stat-value">${state.lists.length}</b>
        <span class="stat-label">Koleksi</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">${ICONS.bookmark}</span>
        <b class="stat-value">${totalBms}</b>
        <span class="stat-label">Simpanan</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">${ICONS.pinned}</span>
        <b class="stat-value">${favCount}</b>
        <span class="stat-label stat-label-compact">Disematkan</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">${ICONS.tag}</span>
        <b class="stat-value">${state.tags.length}</b>
        <span class="stat-label">Tag</span>
      </div>`;

    const recent = bms.slice(0, 6);
    const recentWrap = $("#search-recent-items");
    recentWrap.innerHTML = recent.map(itemCard).join("") || `<div class="empty-state"><p>Belum ada simpanan.</p></div>`;
    bindCards(recentWrap);

    const sortedTags = [...state.tags].sort((a, b) => (b.numBookmarks || 0) - (a.numBookmarks || 0)).slice(0, 10);
    const tagWrap = $("#search-popular-tags");
    tagWrap.innerHTML = sortedTags.map((t, i) =>
      `<button class="price-tag" data-search-tag="${esc(t.name)}" style="background:${TAG_COLORS[i % TAG_COLORS.length]}"><span class="price-tag-hole"></span><span class="price-tag-name">#${esc(t.name)}</span><small>${t.numBookmarks ?? ""}</small></button>`).join("");
    tagWrap.querySelectorAll("[data-search-tag]").forEach((btn) => {
      btn.onclick = () => {
        input.value = btn.dataset.searchTag;
        runSearch(btn.dataset.searchTag);
      };
    });
  } catch {}
}

let searchDebounce = null;
async function runSearch(q) {
  if (!q.trim()) {
    $("#search-initial").hidden = false;
    $("#search-results").hidden = true;
    return;
  }
  $("#search-initial").hidden = true;
  const wrap = $("#search-results");
  wrap.hidden = false;
  wrap.innerHTML = `<div class="empty-state"><p>Mencari...</p></div>`;

  try {
    const data = await apiJson("/api/bookmarks/search?q=" + encodeURIComponent(q) + "&limit=24");
    const items = asArray(data, "bookmarks");
    wrap.innerHTML = items.map(itemCard).join("") || `
      <div class="empty-state">
        ${ICONS.mascot}
        <p>Tidak ada hasil untuk "${esc(q)}".</p>
      </div>`;
    bindCards(wrap);
  } catch {
    wrap.innerHTML = `<div class="empty-state"><p>Gagal mencari.</p></div>`;
  }
}

/* ---------------- Layar Koleksi Berfitur & Mode Geser (Tugas 4) ---------------- */
async function openCollection(listId) {
  state.currentListId = listId;
  state.isSelecting = false;
  state.selectedBookmarks.clear();
  $("#collection-select-bar").hidden = true;

  const list = state.lists.find((l) => l.id === listId);
  $("#collection-title").textContent = list ? list.name : "Koleksi";
  showScreen("collection");

  const data = await apiJson(`/api/lists/${listId}/bookmarks?limit=50`);
  state.collectionItems = asArray(data, "bookmarks");
  renderCollectionGrid();
}

function renderCollectionGrid() {
  const listId = state.currentListId;
  const list = state.lists.find((l) => l.id === listId);
  const items = [...state.collectionItems];
  const sort = localStorage.getItem("poci_sort_" + listId) || "newest";

  if (sort === "newest") {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "oldest") {
    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === "alpha") {
    items.sort((a, b) => judulBersih(a).localeCompare(judulBersih(b), "id"));
  }

  $("#collection-count").textContent = `${items.length} item`;
  const wrap = $("#collection-items");
  wrap.innerHTML = items.map(itemCard).join("") || `
    <div class="empty-state">
      ${ICONS.mascot}
      <p>Koleksi ini masih kosong.</p>
    </div>`;
  bindCards(wrap);

  // Tombol mode geser
  $("#btn-collection-swipe").onclick = () => {
    if (items.length === 0) { toast("Koleksi ini kosong"); return; }
    openSwipeMode(items, list ? list.name : "Koleksi");
  };

  // Tombol menu titik tiga
  $("#btn-collection-menu").onclick = () => openCollectionMenu(list, listId);
}

function openCollectionMenu(list, listId) {
  const html = `
    <div class="sheet-menu-list">
      <button class="sheet-menu-item" id="cmenu-add-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Tambah Link</span>
      </button>
      <button class="sheet-menu-item" id="cmenu-select-multiple">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span>Pilih Banyak</span>
      </button>
      <button class="sheet-menu-item" id="cmenu-sort">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
        <span>Urutkan</span>
      </button>
      <button class="sheet-menu-item" id="cmenu-share">
        ${ICONS.share} <span>Bagikan Koleksi</span>
      </button>
    </div>`;

  showBottomSheet(list ? list.name : "Menu Koleksi", html, (body) => {
    body.querySelector("#cmenu-add-link").onclick = () => {
      const formHtml = `
        <form id="add-link-form" style="padding-top:4px">
          <div class="sheet-form-group">
            <label class="sheet-label" for="add-link-input">URL LINK</label>
            <input class="sheet-input" id="add-link-input" type="url" placeholder="https://..." required autocomplete="off" style="margin-top:8px">
          </div>
          <button type="submit" class="btn-primary btn-sheet-submit">Simpan ke Koleksi</button>
        </form>`;
      showBottomSheet("Tambah Link ke Koleksi", formHtml, (fBody) => {
        const inp = fBody.querySelector("#add-link-input");
        setTimeout(() => inp.focus(), 100);
        fBody.querySelector("#add-link-form").onsubmit = async (e) => {
          e.preventDefault();
          const url = inp.value.trim();
          if (!url) return;
          try {
            const r = await api("/api/bookmarks", { method: "POST", body: JSON.stringify({ type: "link", url }) });
            if (r.ok) {
              const created = await r.json();
              const bid = created.id || created.bookmark?.id;
              if (bid) {
                await api(`/api/lists/${listId}/bookmarks/${bid}`, { method: "PUT" });
                await masukBelumDibuka(bid);
              }
              closeBottomSheet();
              toast("Tersimpan ke koleksi");
              openCollection(listId);
            }
          } catch {
            toast("Gagal menambahkan link");
          }
        };
      });
    };

    body.querySelector("#cmenu-select-multiple").onclick = () => {
      closeBottomSheet();
      state.isSelecting = true;
      state.selectedBookmarks.clear();
      $("#collection-select-bar").hidden = false;
      renderCollectionGrid();
    };

    body.querySelector("#cmenu-sort").onclick = () => {
      const currentSort = localStorage.getItem("poci_sort_" + listId) || "newest";
      const sortHtml = `
        <div style="display:flex;flex-direction:column;gap:10px;padding:4px 0 12px">
          <label style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;cursor:pointer">
            <input type="radio" name="col_sort" value="newest" ${currentSort === "newest" ? "checked" : ""}> Terbaru
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;cursor:pointer">
            <input type="radio" name="col_sort" value="oldest" ${currentSort === "oldest" ? "checked" : ""}> Terlama
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;cursor:pointer">
            <input type="radio" name="col_sort" value="alpha" ${currentSort === "alpha" ? "checked" : ""}> Judul A-Z
          </label>
        </div>`;
      showBottomSheet("Urutkan Simpanan", sortHtml, (sBody) => {
        sBody.querySelectorAll("input[name=col_sort]").forEach((radio) => {
          radio.onchange = () => {
            localStorage.setItem("poci_sort_" + listId, radio.value);
            closeBottomSheet();
            renderCollectionGrid();
          };
        });
      });
    };

    body.querySelector("#cmenu-share").onclick = async () => {
      closeBottomSheet();
      try {
        await api(`/api/lists/${listId}`, { method: "PATCH", body: JSON.stringify({ public: true }) });
        const cfg = await apiJson("/api/config");
        const pubBase = (cfg && cfg.karakeep_public_url) || "http://ai-core:3000";
        const shareUrl = `${pubBase.replace(/\/$/, "")}/public/lists/${listId}`;
        if (navigator.share) {
          try {
            await navigator.share({ title: list ? list.name : "Koleksi", url: shareUrl });
            toast("Tautan dibagikan");
            return;
          } catch {}
        }
        await navigator.clipboard.writeText(shareUrl);
        toast("Tautan koleksi disalin");
      } catch {
        toast("Gagal membagikan");
      }
    };
  });
}

// Tombol pada selection bar di bawah
$("#btn-select-remove").onclick = async () => {
  const ids = Array.from(state.selectedBookmarks);
  if (ids.length === 0) { toast("Pilih simpanan dulu"); return; }
  for (const bid of ids) {
    await api(`/api/lists/${state.currentListId}/bookmarks/${bid}`, { method: "DELETE" }).catch(() => {});
  }
  toast(`${ids.length} dikeluarkan dari koleksi`);
  state.selectedBookmarks.clear();
  state.isSelecting = false;
  $("#collection-select-bar").hidden = true;
  openCollection(state.currentListId);
};

$("#btn-select-delete").onclick = async () => {
  const ids = Array.from(state.selectedBookmarks);
  if (ids.length === 0) { toast("Pilih simpanan dulu"); return; }
  if (!confirm(`Hapus permanen ${ids.length} simpanan terpilih?`)) return;
  for (const bid of ids) {
    await api(`/api/bookmarks/${bid}`, { method: "DELETE" }).catch(() => {});
  }
  toast(`${ids.length} simpanan dihapus`);
  state.selectedBookmarks.clear();
  state.isSelecting = false;
  $("#collection-select-bar").hidden = true;
  openCollection(state.currentListId);
};

$("#btn-select-done").onclick = () => {
  state.isSelecting = false;
  state.selectedBookmarks.clear();
  $("#collection-select-bar").hidden = true;
  renderCollectionGrid();
};

/* ---------------- Mode Geser Koleksi (Tugas 4 & 9) ---------------- */
function openSwipeMode(items, title) {
  state.isSwipeMode = true;
  state.swipeTitle = title;
  state.focusQueue = items;
  state.focusIndex = 0;
  showScreen("focus");
  renderFocusCard();
}

/* ---------------- Resolver Keanggotaan Koleksi Nyata (Tugas E) ---------------- */
async function resolveBookmarkLists(bookmarkId, forceRefresh = false) {
  if (!state.membershipCache) state.membershipCache = new Map();
  if (!forceRefresh && state.membershipCache.has(bookmarkId)) {
    return state.membershipCache.get(bookmarkId);
  }

  if (!state.lists || !state.lists.length) {
    const ld = await apiJson("/api/lists");
    state.lists = asArray(ld, "lists");
  }

  const results = await Promise.all(
    state.lists.map(async (l) => {
      try {
        const bmsData = await apiJson(`/api/lists/${l.id}/bookmarks?limit=100`);
        const bms = asArray(bmsData, "bookmarks");
        return bms.some((item) => item.id === bookmarkId) ? l : null;
      } catch {
        return null;
      }
    })
  );
  const containingLists = results.filter(Boolean);
  state.membershipCache.set(bookmarkId, containingLists);
  return containingLists;
}

/* ---------------- Layar Detail Kaya Aksi (Tugas 5 & Tugas E) ---------------- */
async function openDetail(id) {
  showScreen("detail");
  const wrap = $("#screen-detail");
  wrap.innerHTML = `<div class="empty-state"><p>Memuat detail...</p></div>`;

  const [b, listsData] = await Promise.all([
    apiJson("/api/bookmarks/" + id),
    apiJson("/api/lists"),
  ]);
  state.lists = asArray(listsData, "lists");
  const containingLists = await resolveBookmarkLists(id);

  const c = b.content || {};
  const img = cardImage(b);

  // Koleksi bookmark ini (Tugas E: keanggotaan nyata)
  const parentList = containingLists[0] || null;
  const listMeta = parentList ? parseListMeta(parentList) : null;
  const listChipText = parentList ? esc(parentList.name) : "Tanpa koleksi";
  const listChipDot = parentList ? `<span class="chip-collection-dot" style="background:${listMeta.color}"></span>` : "";

  // Tag list
  const tagsHtml = (b.tags || []).map((t) => `
    <span class="price-tag tag-pill-removable" style="background:#FED264">
      <span class="price-tag-hole"></span>
      <span class="price-tag-name">#${esc(t.name)}</span>
      <button class="tag-del-btn" data-del-tag="${esc(t.name)}" aria-label="Hapus tag">&times;</button>
    </span>`).join("");

  const urlText = c.url || "";
  const displayUrl = urlText.replace(/^https?:\/\/(www\.)?/, "");

  wrap.innerHTML = `
    <header class="sub-top">
      <button class="btn-square" id="detail-back-btn" aria-label="Kembali">${ICONS.arrowLeft}</button>
      <h2>Detail Simpanan</h2>
    </header>

    ${img ? `<div class="detail-photo-wrap"><img src="${esc(img)}" alt=""></div>` : ""}

    <div class="detail-title-wrap">
      <h1 class="detail-title" id="detail-title-text">${esc(judulBersih(b, true))}</h1>
      <button class="btn-pencil" id="detail-pencil-btn" aria-label="Edit Judul">${ICONS.pencil}</button>
    </div>

    <div id="detail-title-editor" class="detail-inline-edit" hidden>
      <input type="text" class="detail-inline-input" id="detail-title-input" value="${esc(b.title || c.title || "")}">
      <div class="detail-inline-buttons">
        <button class="btn-secondary" id="detail-title-cancel" style="height:36px;padding:0 14px;font-size:13px">Batal</button>
        <button class="btn-primary" id="detail-title-save" style="height:36px;padding:0 16px;font-size:13px">Simpan</button>
      </div>
    </div>

    <div class="detail-meta-row">
      <button class="chip-collection-meta" id="detail-chip-col-btn">
        ${listChipDot}
        <span>${listChipText}</span>
      </button>
      <span class="detail-date-text">${formatDateTime(b.createdAt)}</span>
    </div>

    ${c.type === "link" ? `
      <a class="btn-primary btn-detail-open" href="${esc(c.url)}" target="_blank" rel="noopener">
        <span>Buka link</span>
        <span class="btn-detail-url">${esc(displayUrl)}</span>
      </a>` : ""}

    <div class="detail-action-bar">
      <button class="detail-action-tile" id="daction-share">
        ${ICONS.share}
        <span>Bagikan</span>
      </button>
      <button class="detail-action-tile" id="daction-move">
        ${ICONS.move}
        <span>Pindah</span>
      </button>
      ${!state.hideRecrawlSession ? `
        <button class="detail-action-tile" id="daction-recrawl">
          ${ICONS.refresh}
          <span>Segarkan</span>
        </button>` : ""}
      <button class="detail-action-tile danger" id="daction-delete">
        ${ICONS.trash}
        <span>Hapus</span>
      </button>
    </div>

    <div style="margin-bottom:16px">
      <button class="btn-secondary" id="detail-archive" style="width:100%;height:40px;font-size:13.5px">
        ${b.archived ? "Keluarkan dari arsip" : "Arsipkan"}
      </button>
    </div>

    <div class="detail-section-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0">Tag</h3>
        <button class="btn-add-tag" id="btn-show-add-tag">+ Tambah</button>
      </div>
      <div id="add-tag-form-wrap" hidden style="margin-bottom:10px">
        <div style="display:flex;gap:6px">
          <input type="text" id="new-tag-input" class="sheet-input" placeholder="Nama tag..." style="height:38px;font-size:13.5px">
          <button class="btn-primary" id="new-tag-save" style="height:38px;padding:0 14px;font-size:13px">Simpan</button>
        </div>
      </div>
      <div class="tag-cloud" id="detail-tag-cloud">${tagsHtml}</div>
    </div>

    <div class="detail-section-card">
      <h3 style="margin-bottom:8px">Catatan</h3>
      <textarea id="detail-note-input" class="detail-note-area" placeholder="Ketuk untuk menambah catatan...">${esc(b.note || "")}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:8px">
        <button class="btn-secondary" id="detail-note-save" style="height:36px;padding:0 16px;font-size:13px;font-weight:700">Simpan Catatan</button>
      </div>
    </div>

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
      </div>` : ""}`;

  // Kembali
  $("#detail-back-btn").onclick = () => {
    if (state.currentListId) {
      openCollection(state.currentListId);
    } else if (state.detailPreviousScreen === "search") {
      showScreen("search");
    } else if (state.detailPreviousScreen === "library") {
      showScreen("library");
      loadLibrary(false);
    } else {
      showScreen("home");
      loadHome();
    }
  };

  // Edit judul sebaris (Tugas 5)
  const titleTextEl = $("#detail-title-text");
  const editorEl = $("#detail-title-editor");
  const pencilBtn = $("#detail-pencil-btn");
  pencilBtn.onclick = () => {
    editorEl.hidden = false;
    titleTextEl.parentElement.hidden = true;
    $("#detail-title-input").focus();
  };
  $("#detail-title-cancel").onclick = () => {
    editorEl.hidden = true;
    titleTextEl.parentElement.hidden = false;
  };
  $("#detail-title-save").onclick = async () => {
    const newTitle = $("#detail-title-input").value.trim();
    if (!newTitle) return;
    try {
      await api(`/api/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify({ title: newTitle }) });
      b.title = newTitle;
      titleTextEl.textContent = newTitle;
      editorEl.hidden = true;
      titleTextEl.parentElement.hidden = false;
      toast("Judul diperbarui");
    } catch {
      toast("Gagal mengubah judul");
    }
  };

  // Pindah koleksi (chip meta & aksi Pindah - Tugas E)
  const handleMove = () => {
    const currentListId = parentList ? parentList.id : "";
    const listsHtml = `
      <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0 16px">
        <label class="sheet-menu-item" style="cursor:pointer">
          <input type="radio" name="move_dest" value="" ${!currentListId ? "checked" : ""}>
          <span>Tanpa koleksi</span>
        </label>
        ${state.lists.map((l) => {
          const isCurrent = currentListId === l.id;
          const meta = parseListMeta(l);
          return `
            <label class="sheet-menu-item" style="cursor:pointer">
              <input type="radio" name="move_dest" value="${l.id}" ${isCurrent ? "checked" : ""}>
              <span class="chip-collection-dot" style="background:${meta.color}"></span>
              <span>${esc(l.name)}</span>
            </label>`;
        }).join("")}
      </div>`;

    showBottomSheet("Pindahkan Simpanan", listsHtml, (mBody) => {
      mBody.querySelectorAll("input[name=move_dest]").forEach((radio) => {
        radio.onchange = async () => {
          const destId = radio.value;
          closeBottomSheet();
          try {
            let deleteFailed = false;
            if (destId) {
              // 1. PUT ke tujuan
              await api(`/api/lists/${destId}/bookmarks/${id}`, { method: "PUT" });
              // 2. DELETE dari SEMUA list lain yang memuatnya
              const toRemove = containingLists.filter((l) => l.id !== destId);
              for (const l of toRemove) {
                try {
                  await api(`/api/lists/${l.id}/bookmarks/${id}`, { method: "DELETE" });
                } catch {
                  deleteFailed = true;
                }
              }
              if (deleteFailed) {
                toast("Sebagian gagal dipindahkan, coba lagi");
              } else {
                const destList = state.lists.find((l) => l.id === destId);
                toast(`Dipindahkan ke ${destList ? destList.name : "Koleksi"}`);
              }
            } else {
              // Tujuan Tanpa koleksi: DELETE dari SEMUA list yang memuatnya
              for (const l of containingLists) {
                try {
                  await api(`/api/lists/${l.id}/bookmarks/${id}`, { method: "DELETE" });
                } catch {
                  deleteFailed = true;
                }
              }
              if (deleteFailed) {
                toast("Sebagian gagal dipindahkan, coba lagi");
              } else {
                toast("Dikeluarkan dari koleksi");
              }
            }
            // Segarkan cache keanggotaan dan render ulang detail
            await resolveBookmarkLists(id, true);
            openDetail(id);
          } catch {
            toast("Gagal memindahkan");
          }
        };
      });
    });
  };

  $("#detail-chip-col-btn").onclick = handleMove;
  $("#daction-move").onclick = handleMove;

  // Bagikan
  $("#daction-share").onclick = async () => {
    const shareTitle = judulBersih(b);
    const shareUrl = c.url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        toast("Tautan dibagikan");
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareUrl);
    toast("Tautan disalin");
  };

  // Segarkan (recrawl)
  const recrawlBtn = $("#daction-recrawl");
  if (recrawlBtn) {
    recrawlBtn.onclick = async () => {
      recrawlBtn.classList.add("loading");
      try {
        const r = await api(`/api/bookmarks/${id}/recrawl`, { method: "POST" });
        if (r.status === 404) {
          toast("Segarkan tidak didukung versi server ini");
          state.hideRecrawlSession = true;
          recrawlBtn.hidden = true;
          return;
        }
        if (r.ok) {
          toast("Simpanan disegarkan");
          openDetail(id);
        } else {
          toast("Gagal menyegarkan");
        }
      } catch {
        toast("Gagal menyegarkan");
      } finally {
        recrawlBtn.classList.remove("loading");
      }
    };
  }

  // Hapus
  $("#daction-delete").onclick = async () => {
    if (!confirm("Hapus simpanan ini?")) return;
    await api("/api/bookmarks/" + id, { method: "DELETE" });
    toast("Simpanan dihapus");
    if (state.currentListId) openCollection(state.currentListId);
    else { showScreen("home"); loadHome(); }
  };

  // Arsipkan
  $("#detail-archive").onclick = async () => {
    await api("/api/bookmarks/" + id, { method: "PATCH", body: JSON.stringify({ archived: !b.archived }) });
    toast(b.archived ? "Dikeluarkan dari arsip" : "Diarsipkan");
    openDetail(id);
  };

  // Tambah & Lepas Tag
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
      await api(`/api/bookmarks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ tags: currentTags }),
      });
      toast("Tag ditambahkan");
      openDetail(id);
    } catch {
      toast("Gagal menambah tag");
    }
  };

  wrap.querySelectorAll("[data-del-tag]").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const delName = btn.dataset.delTag;
      const updatedTags = (b.tags || []).map((t) => t.name).filter((n) => n !== delName);
      try {
        await api(`/api/bookmarks/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ tags: updatedTags }),
        });
        toast("Tag dilepas");
        openDetail(id);
      } catch {
        toast("Gagal melepas tag");
      }
    };
  });

  // Catatan
  $("#detail-note-save").onclick = async () => {
    const noteVal = $("#detail-note-input").value;
    try {
      await api(`/api/bookmarks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ note: noteVal }),
      });
      toast("Catatan disimpan");
    } catch {
      toast("Gagal menyimpan catatan");
    }
  };
}

/* ---------------- Focus Mode & Mode Geser (Tugas 4 & 9) ---------------- */
async function openFocus() {
  state.isSwipeMode = false;
  state.swipeTitle = "";
  showScreen("focus");
  const wrap = $("#screen-focus");
  wrap.innerHTML = `<div class="empty-state" style="color:#A9A9A9"><p>Menyiapkan Focus Mode...</p></div>`;

  let items;
  if (state.focusListId) {
    const data = await apiJson(`/api/lists/${state.focusListId}/bookmarks?limit=30`);
    items = asArray(data, "bookmarks");
  } else {
    const data = await apiJson("/api/bookmarks?limit=15");
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
        <p>${state.isSwipeMode ? "Kamu sudah melihat semua simpanan di koleksi ini." : "Semua simpanan di antrean ini sudah kamu lihat. Kerja bagus."}</p>
        <button class="btn-primary" id="focus-done" style="max-width:280px;margin-top:16px">
          ${state.isSwipeMode ? "Kembali ke Koleksi" : "Kembali ke Beranda"}
        </button>
      </div>`;
    $("#focus-done").onclick = () => {
      if (state.isSwipeMode && state.currentListId) openCollection(state.currentListId);
      else { showScreen("home"); loadHome(); }
    };
    return;
  }

  const b = q[state.focusIndex];
  const c = b.content || {};
  const img = cardImage(b);
  const segs = q.map((_, i) => `<i class="${i <= state.focusIndex ? "done" : ""}"></i>`).join("");
  const tags = (b.tags || []).slice(0, 3).map((t, i) =>
    `<span class="price-tag" style="background:${TAG_COLORS[i % TAG_COLORS.length]}"><span class="price-tag-hole"></span><span class="price-tag-name">#${esc(t.name)}</span></span>`
  ).join("");

  const label = state.isSwipeMode ? esc(state.swipeTitle.toUpperCase()) : "SIMPANAN BARU";
  const descClean = deskripsiBersih(b);

  wrap.innerHTML = `
    <header class="focus-top">
      <strong class="focus-label">${label}</strong>
      <span class="focus-count">${String(state.focusIndex + 1).padStart(2, "0")}/${String(q.length).padStart(2, "0")}</span>
    </header>

    ${!state.isSwipeMode ? `<div class="focus-progress">${segs}</div>` : ""}

    <div class="focus-center-wrap">
      <div class="focus-card">
        <p class="focus-card-source">${esc(cardSource(b))}</p>
        ${img ? `<div class="focus-card-photo"><img src="${esc(img)}" alt=""></div>` : ""}
        <h3 class="focus-card-title">${esc(judulBersih(b))}</h3>
        ${descClean ? `<p class="focus-card-desc">${esc(descClean.slice(0, 160))}</p>` : ""}
        ${tags ? `<div class="tag-cloud" style="margin-top:10px;margin-bottom:0">${tags}</div>` : ""}
      </div>

      <div class="focus-actions">
        <button class="btn-circle-action" id="focus-prev" ${state.focusIndex === 0 ? "disabled" : ""} aria-label="Sebelumnya">
          ${ICONS.arrowLeft}
        </button>
        ${c.type === "link"
          ? `<button class="btn-primary" id="focus-open">Buka link</button>`
          : `<button class="btn-primary" id="focus-open">Lihat detail</button>`}
        <button class="btn-circle-action" id="focus-next" aria-label="Berikutnya">
          ${ICONS.arrowRight}
        </button>
      </div>
    </div>`;

  $("#focus-prev").onclick = () => {
    if (state.focusIndex > 0) {
      state.focusIndex--;
      renderFocusCard();
    }
  };

  $("#focus-next").onclick = async () => {
    await keluarAntrean(b);
    pindahKeKategoriBilaYatim(b);
    state.focusIndex++;
    renderFocusCard();
  };

  $("#focus-open").onclick = async () => {
    if (c.type === "link") window.open(c.url, "_blank");
    else openDetail(b.id);

    await keluarAntrean(b);
    pindahKeKategoriBilaYatim(b);
    state.focusIndex++;
    renderFocusCard();
  };
}

/* ---------------- Acara Global ---------------- */
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

  $("#btn-home-see-library").addEventListener("click", () => { showScreen("library"); loadLibrary(); });
  $("#btn-search").addEventListener("click", openSearch);
  $("#btn-search-cancel").addEventListener("click", () => { showScreen("home"); loadHome(); });

  $("#search-input").addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => runSearch(e.target.value), 220);
  });

  $("#btn-settings").addEventListener("click", async () => {
    showScreen("settings");
    try {
      const h = await apiJson("/api/health");
      $("#server-status").textContent = h.karakeep ? "Terhubung ke Karakeep" : "Karakeep tidak terjangkau";
    } catch {
      $("#server-status").textContent = "Tidak terjangkau";
    }
  });

  $("#btn-focus").addEventListener("click", openFocus);
  $("#btn-load-more").addEventListener("click", () => loadLibrary(false));
  $("#btn-logout").addEventListener("click", async () => { await fetch("/auth/logout", { method: "POST" }); showLogin(); });

  $("#quick-save-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = $("#quick-save-input").value.trim();
    if (!url) return;
    const r = await api("/api/bookmarks", { method: "POST", body: JSON.stringify({ type: "link", url }) });
    if (r.ok) {
      const created = await r.json().catch(() => null);
      await masukBelumDibuka(created && (created.id || created.bookmark?.id));
      $("#quick-save-input").value = ""; toast("Tersimpan, sedang diproses"); loadHome();
    }
    else toast("Gagal menyimpan, periksa link-nya");
  });

  // Tombol buat koleksi baru -> Buka Sheet Koleksi Baru (Tugas 2)
  $("#btn-new-collection").addEventListener("click", () => {
    openCollectionSheet(null);
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
  } catch {
    showLogin();
  }
})();
