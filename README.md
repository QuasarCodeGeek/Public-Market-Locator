# 🏪 Public Market Store Locator

A web app for finding stores and services inside a public market — with an interactive 2D SVG map, real-time updates, and role-based access for store owners and admins.

Built with **Next.js**, **Supabase**, and **Tailwind CSS**. Deployed on **Vercel**.

---

## Features

### Public
- Interactive 2D SVG map of the market floor plan
- Clickable stalls — view store name, category, description, and operating hours
- Floor switcher (Floor 1 / Floor 2)
- Search stores by name, category, or description
- Real-time updates via Supabase WebSocket — no page refresh needed

### Store Owners
- Register and log in with email and password
- Create and edit store profile (name, description, category, type, TIN number, operating hours)
- View stall assignment status

### Admin
- Assign stores to specific stalls on the map
- Reassign or unassign stalls
- Toggle store active/inactive status
- Manage users — search, filter, sort, and change roles (owner/admin)
- Manage stores — search, filter by status, sort by name/category/type

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (WebSocket) |
| Deployment | Vercel |

---

## Database Schema

```
auth.users         — Supabase managed auth table
profiles           — id, full_name, role (admin/owner)
blocks             — id, name, floor
stalls             — id, block_id, row_num, col_num, floor
stores             — id, owner_id, stall_id, name, description,
                     category, type, tin_number, operating_hours, is_active
```

### Relationships
- Each `store` belongs to an `auth.user` via `owner_id`
- Each `store` is assigned to a `stall` via `stall_id` (assigned by admin)
- Each `stall` belongs to a `block`

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (for deployment)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/public-market-locator.git
cd public-market-locator

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema in the Supabase SQL Editor (see `/supabase/schema.sql`)
3. Enable Realtime for `stores` and `stalls` tables:

```sql
alter publication supabase_realtime add table stores;
alter publication supabase_realtime add table stalls;
```

4. Run the seed data to populate blocks and stalls

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
public-market-locator/
├── app/
│   ├── (auth)/
│   │   ├── login/         — Login page
│   │   └── register/      — Register page
│   ├── admin/             — Admin panel
│   ├── components/
│   │   ├── FloorSwitcher  — Floor 1 / Floor 2 toggle
│   │   ├── MarketMap      — SVG map component
│   │   ├── Navbar         — Sticky navbar with hamburger menu
│   │   └── StallPanel     — Store details panel
│   ├── dashboard/         — Store owner dashboard
│   ├── lib/
│   │   └── supabase.ts    — Supabase client
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           — Main map page
├── proxy.ts               — Next.js middleware (auth protection)
├── .env.local
└── package.json
```

---

## Roles

| Role | Access |
|---|---|
| Public | View map, search stores |
| Owner | Dashboard — create/edit own store |
| Admin | Admin panel — manage all stores, stalls, and users |

> Admin role is assigned manually via Supabase SQL or the admin panel.

---

## Deployment

The app is deployed on Vercel. Add the environment variables in the Vercel project settings before deploying.

```bash
# Build locally to check for errors
npm run lint
npm run build

# Push to GitHub — Vercel auto-deploys on push
git push origin main
```

---

## License

MIT