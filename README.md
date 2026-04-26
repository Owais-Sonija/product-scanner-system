# Product Scanner System

A full-stack product scanning and data management system 
built for retail businesses operating across multiple 
locations. Staff use tablet PWAs to scan product barcodes 
and record confirmations. Administrators manage products, 
import data via CSV, and monitor confirmation logs through 
a dedicated desktop dashboard.

---

## Live Demo

| App | URL |
|---|---|
| Tablet PWA | To be added after deployment |
| Admin Panel | To be added after deployment |

### Demo Credentials
| Account | Email | Password | Role |
|---|---|---|---|
| Admin | admin@productscanner.com | Admin@1234 | Full access |
| Staff | staff@productscanner.com | Staff@1234 | Tablet only |

---

## Project Structure

product-scanning-system-final/
├── product-scanner/     ← Tablet PWA (staff use)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   └── scanner.ts       # ZXing barcode scanner
│   │   ├── store/
│   │   │   └── authStore.ts     # Zustand auth store
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ui/
│   │   │       ├── Toggle.tsx   # iOS-style toggle
│   │   │       └── ComboInput.tsx # Searchable dropdown
│   │   └── pages/
│   │       ├── Login.tsx        # Staff login
│   │       ├── ScanPage.tsx     # Camera scanner
│   │       ├── ProductDetail.tsx # Product + confirmations
│   │       └── RegisterProduct.tsx # New product form
│   └── package.json
│
├── admin-panel/         ← Admin Desktop App
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Sidebar + header
│   │   │   └── ProtectedRoute.tsx
│   │   └── pages/
│   │       ├── Login.tsx        # Admin login
│   │       ├── Dashboard.tsx    # Stats overview
│   │       ├── Products.tsx     # View/edit/delete
│   │       ├── ImportCSV.tsx    # CSV bulk import
│   │       ├── Logs.tsx         # Confirmation logs
│   │       ├── Locations.tsx    # Store locations
│   │       └── Staff.tsx        # Staff management
│   └── package.json
│
└── README.md

---

## Tech Stack

### Tablet PWA
- React 18 + TypeScript + Vite
- Tailwind CSS v3 (dark theme)
- Supabase JS Client
- @zxing/library (barcode scanning)
- Zustand (auth state)
- React Router v6

### Admin Panel
- React 18 + TypeScript + Vite
- Tailwind CSS v3 (dark theme)
- Supabase JS Client
- PapaParse (CSV parsing)
- Zustand (auth state)
- React Router v6

### Backend / Database
- Supabase (PostgreSQL)
- Supabase Auth (role-based)
- Row Level Security (RLS)

### Hosting
- Vercel (both apps, free tier)
- Supabase (database + auth, free tier)

---

## Features

### Tablet App (Staff)
- Camera-based barcode scanning (ZXing)
- Automatic back camera selection on mobile devices
- Manual barcode entry fallback
- Product lookup with under 1 second response
- Display all 28 boolean product attributes
- Two-step confirmation with individual timestamps
- New product registration with 28 toggle fields
- Searchable dropdowns for manufacturer and country
- Custom value entry with persistent memory
- Select all / deselect all toggle buttons
- PWA optimized (works in iPad/Android browser)
- Large touch targets for operational environments

### Admin Panel (Desktop)
- Secure admin-only authentication
- Real-time dashboard with 30-second auto-refresh
- Product management (view, edit, delete)
- Bulk CSV import with validation and progress
- CSV template download
- Confirmation logs with filters and CSV export
- Store location management
- Staff user management with location assignment
- Free tier limits with automatic old log cleanup

### Security
- Supabase Row Level Security on all tables
- Staff: read and insert only
- Admin: full access
- Role verification on every protected route

---

## Database Schema

### Tables
| Table | Purpose |
|---|---|
| products | Product catalog with 28 boolean fields |
| locations | Store/branch locations |
| profiles | User profiles extending auth.users |
| confirmation_logs | Staff confirmation audit trail |

### Key Design Decisions
- UUID primary keys on all tables
- Cascade deletes (delete product → deletes its logs)
- Auto-updated updated_at trigger on products
- Auto-created profile trigger on user signup
- Location tracking on every product and log entry

---

## Local Setup

### Prerequisites
- Node.js v18+
- Supabase account (free)

### 1. Clone the repository
git clone https://github.com/Owais-Sonija/product-scanner-system.git
cd product-scanner-system

### 2. Set up Supabase
- Create a new Supabase project
- Go to SQL Editor and run the schema (see below)
- Go to Authentication → Users and create admin user
- Run the profile setup SQL

### 3. Database Schema
Run schema.sql in Supabase SQL Editor.
Creates: products, locations, profiles, 
confirmation_logs tables with RLS policies.

### 4. Tablet App Setup
cd product-scanner
npm install
cp .env.example .env
Add your Supabase URL and anon key to .env
npm run dev
Opens at: http://localhost:5173

### 5. Admin Panel Setup
cd admin-panel
npm install
cp .env.example .env
Add your Supabase URL and anon key to .env
npm run dev -- --port 5174
Opens at: http://localhost:5174

---

## Environment Variables

Both apps use the same two variables:

| Variable | Description |
|---|---|
| VITE_SUPABASE_URL | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Your Supabase anon public key |

---

## CSV Import Format

Download the template from Admin Panel → Import CSV.
Required columns: barcode, product_name
Optional: manufacturer, source_url, country, notes
Boolean fields: field_01 through field_28
Boolean values must be TRUE or FALSE (case insensitive)

---

## Setup Documentation

### How to add a new location
1. Login to Admin Panel
2. Go to Locations page
3. Click "Add New Location"
4. Enter name (e.g. "Downtown Branch") and code (e.g. "DT")

### How to add a new staff member
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → enter email and password
3. Login to Admin Panel → Staff page
4. Find the new user → assign their location

### How to reset staff access
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user → click three dots → Reset Password
3. Send them the new temporary password

### How to import products from Google Sheets
1. In Google Sheets, go to File → Download → CSV
2. Login to Admin Panel → Import CSV
3. Download the template first to see required format
4. Drag and drop your CSV file
5. Review the preview and fix any errors shown
6. Click "Import X Products"

---

## Free Tier Limits
| Resource | Limit | Auto-cleanup |
|---|---|---|
| Products | 500 max | Warning at 400 |
| Confirmation logs | 200 max | Auto-delete oldest 50 |
| Supabase DB | 500MB | Monitor in dashboard |

---

## Built By
- Developer: [Owais Sonija](https://github.com/Owais-Sonija)
- Agency: [martz.live](http://martz.live/)

---

## License
Private project — all rights reserved.
