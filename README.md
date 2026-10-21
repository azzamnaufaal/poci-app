# Poci

Frontend web pribadi untuk Karakeep yang di-host sendiri di homelab, dengan bahasa desain neo-brutalist ringan bergaya Tuckii. Karakeep menjadi mesinnya (crawling, arsip halaman, OCR, pencarian, tag dan ringkasan AI, API), Poci menjadi wajahnya.

Prinsipnya satu: ambil dari mana pun, semua tersimpan di satu tempat. Pintu tangkap di iPhone adalah Shortcut iOS "Simpan ke Poci" yang menembak API Karakeep langsung. Frontend ini untuk membaca, menelusuri, dan meninjau simpanan.

## Arsitektur

- `server/` - proxy tipis FastAPI mengikuti pola CreatorOS. Browser tidak pernah melihat API key Karakeep: key hanya hidup di `.env` server, proxy yang meneruskan panggilan ke Karakeep dengan header Bearer. Login Poci memakai session cookie sendiri (30 hari).
- `web/` - frontend statis tanpa framework dan tanpa build step. Satu berkas HTML, satu CSS dengan token tema terang dan gelap, satu JS. Navigasi berpindah layar penuh seperti tab, setiap layar panjang punya satu area gulir saja.
- `demo/` - Karakeep tiruan (stub FastAPI) berisi data contoh, supaya UI bisa dijalankan dan ditinjau di laptop tanpa Karakeep asli.

## Jalan lokal di laptop (mode demo)

Syarat: Python 3.12.

```bash
bash demo/run-demo.sh
```

Lalu buka http://localhost:8100 dan masuk dengan username `naufal`, password `demo`. Data yang tampil adalah data contoh dari stub, bukan data asli. Hentikan dengan Ctrl+C.

## Jalan lokal melawan Karakeep asli

Karakeep berjalan di homelab dan bisa dijangkau laptop lewat Tailscale di http://ai-core:3000. Buat API key khusus di dashboard Karakeep (Settings, API Keys), lalu:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r server/requirements.txt
KARAKEEP_BASE_URL=http://ai-core:3000 \
KARAKEEP_API_KEY=<key khusus dari dashboard> \
POCI_USERNAME=<bebas> \
POCI_PASSWORD=<bebas> \
SESSION_SECRET=<acak, misalnya hasil openssl rand -hex 32> \
uvicorn server.main:app --host 127.0.0.1 --port 8100
```

Jangan pernah menulis API key asli ke berkas yang ter-commit. Untuk pemakaian lokal, key cukup ada di variabel lingkungan sesi terminal.

## Variabel lingkungan

| Nama | Isi |
| --- | --- |
| KARAKEEP_BASE_URL | Alamat Karakeep. Di Docker homelab: http://karakeep-web-1:3000 (nama container di jaringan ai-network). Di laptop: http://ai-core:3000 |
| KARAKEEP_API_KEY | API key Karakeep khusus untuk Poci (buat terpisah, bisa dicabut sendiri) |
| POCI_USERNAME | Username login Poci |
| POCI_PASSWORD | Password login Poci |
| SESSION_SECRET | Rahasia penanda session, buat dengan openssl rand -hex 32 |

## Deploy ke homelab (nanti, setelah lolos tinjauan laptop)

1. Salin repo ke ~/homelab/apps/poci di server, buat folder ~/homelab/data/poci.
2. Salin .env.example menjadi .env dan isi nilainya di server. Nilai .env tidak pernah keluar dari server.
3. Jalankan docker compose up -d --build.
4. Buka http://ai-core:8100, masuk, dan uji: Beranda memuat koleksi dan simpanan asli, simpan cepat satu link, buka Focus Mode, ganti tema gelap, pasang ke Home Screen iPhone.
5. Titik Cek 4: pakai sehari penuh sebelum dinyatakan selesai.

## Status dan celah yang diketahui

Sudah terbukti jalan (uji lokal dengan data contoh, 21 Okt 2026): login dan session, Beranda, Perpustakaan dengan panel statistik dan awan tag, Pencarian, Detail dengan Ringkasan AI, Isi Koleksi, Focus Mode memakai daftar "Belum Dibuka", tema gelap, proxy aset gambar.

Tiga bug ditemukan dan diperbaiki saat uji lokal tersebut: dependensi itsdangerous yang kurang, httpx yang perlu trust_env=False untuk panggilan internal, dan aturan CSS yang menimpa atribut hidden sampai navigasi antarlayar mati visual.

Belum dikerjakan, jadi daftar periksa peninjauan:

- Sheet Koleksi Baru yang penuh (pilihan warna tab dan ikon). Saat ini pembuatan koleksi masih memakai prompt nama sederhana.
- Layar Semua Koleksi di dalam Perpustakaan untuk koleksi di atas 6. Saat ini Beranda menampilkan maksimal 6 folder pertama.
- Daftar "Belum Dibuka" perlu dibuat di Karakeep dan diputuskan apakah Shortcut ikut mengisi daftar itu, supaya antrean Focus Mode resmi, bukan cadangan dari simpanan terbaru.
- Ikon PWA di manifest masih kosong.
- Verifikasi tag AI pada bookmark screenshot (model gambar di Karakeep) masih menunggu pemeriksaan.

## Keamanan

- API key Karakeep hanya ada di sisi server. Jangan pindahkan ke frontend, jangan commit ke repo.
- Poci hanya untuk jaringan pribadi (LAN dan Tailscale). Jangan ekspos ke internet publik.
- Versi Karakeep dipatok. Backup folder apps dan data sebelum upgrade apa pun.
