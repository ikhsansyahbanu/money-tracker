# Money Tracker

Aplikasi pencatat keuangan pribadi berbasis web. Dibangun dengan Next.js 14, TypeScript, PostgreSQL, dan Docker.

## Fitur

- Multi user dengan auth (register, login)
- Catat pemasukan & pengeluaran
- Multi akun (cash, bank, e-wallet)
- Kategori transaksi dengan icon & warna
- Scan struk belanja via OCR (Gemini 2.5 Flash)
- Budget per kategori per bulan
- Laporan & chart bulanan

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: NextAuth.js v5 (credentials + JWT)
- **OCR**: OpenRouter → google/gemini-2.5-flash
- **Deploy**: Docker Compose + Nginx + VPS

---

## Cara Menjalankan (Development)

### 1. Clone & install

```bash
git clone https://github.com/username/money-tracker.git
cd money-tracker
npm install
```

### 2. Setup env

```bash
cp .env.example .env.local
# Edit .env.local — isi DATABASE_URL, NEXTAUTH_SECRET, OPENROUTER_API_KEY
```

### 3. Jalankan database

```bash
docker compose up -d db
```

### 4. Migrate database

```bash
npm run db:generate
npm run db:migrate
```

### 5. Jalankan app

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Deploy ke VPS

### Setup awal (sekali saja)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Clone repo
git clone https://github.com/username/money-tracker.git
cd money-tracker

# Setup SSL
sudo certbot --nginx -d yourdomain.com

# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/money-tracker
sudo ln -s /etc/nginx/sites-available/money-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup env production
cp .env.example .env.production
# Edit .env.production dengan value production

# Deploy pertama kali
chmod +x deploy.sh
./deploy.sh
```

### Deploy berikutnya

```bash
./deploy.sh
```

---

## Struktur Folder

```
src/
  app/
    (auth)/          # login, register
    (dashboard)/     # halaman utama: dashboard, transaksi, akun, kategori, budget
    api/             # REST API routes
  lib/
    db.ts            # koneksi PostgreSQL via Drizzle
    auth.ts          # NextAuth config
  hooks/
    useOcr.ts        # hook untuk OCR struk
drizzle/
  schema.ts          # definisi tabel database
docker-compose.yml          # development
docker-compose.prod.yml     # production
Dockerfile
nginx.conf
deploy.sh
```

---

## Environment Variables

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random string panjang untuk JWT signing |
| `NEXTAUTH_URL` | URL aplikasi (http://localhost:3000 atau https://domain.com) |
| `OPENROUTER_API_KEY` | API key dari openrouter.ai untuk OCR struk |

---

## API Endpoints

### Auth
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Daftar user baru |
| POST | `/api/auth/signin` | Login (NextAuth) |

### Accounts
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/accounts` | Daftar akun |
| POST | `/api/accounts` | Buat akun baru |
| PATCH | `/api/accounts/[id]` | Edit akun |
| DELETE | `/api/accounts/[id]` | Hapus akun |

### Categories
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/categories` | Daftar kategori |
| POST | `/api/categories` | Buat kategori |
| PATCH | `/api/categories/[id]` | Edit kategori |
| DELETE | `/api/categories/[id]` | Hapus kategori |

### Transactions
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/transactions` | List transaksi (filter: month, accountId, categoryId, type) |
| POST | `/api/transactions` | Buat transaksi + items |
| GET | `/api/transactions/[id]` | Detail transaksi + items |
| PATCH | `/api/transactions/[id]` | Edit transaksi |
| DELETE | `/api/transactions/[id]` | Hapus transaksi |
| GET | `/api/transactions/summary` | Total income/expense/balance per bulan |

### Budgets
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/budgets` | Budget + spending aktual (filter: month) |
| POST | `/api/budgets` | Set budget (upsert) |
| DELETE | `/api/budgets/[id]` | Hapus budget |

### Reports
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/reports/categories` | Pengeluaran per kategori + persentase |
| GET | `/api/reports/monthly` | Tren income vs expense N bulan terakhir |

### OCR
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/ocr` | Upload foto struk → ekstrak data (foto tidak disimpan) |
