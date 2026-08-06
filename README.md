# TextileHub — B2B Textile Marketplace

A B2B marketplace prototype connecting textile **buyers** and **suppliers** — discover fabrics,
compare pricing and MOQ, place bulk orders, and track fulfillment end-to-end, with an AI
assistant that searches live inventory instead of giving canned answers.

## Live Demo

- **Client:** https://textilehub.vercel.app
- **Server API:** https://textilehub-server.vercel.app

### Demo accounts

| Role     | Email                          | Password    |
|----------|---------------------------------|-------------|
| Buyer    | demo.buyer@textilehub.com       | Demo@1234   |
| Supplier | demo.supplier@textilehub.com    | Demo@1234   |

Both accounts are pre-onboarded with real seeded orders/products, so you can log in and explore
immediately instead of registering from scratch. The demo login buttons on the `/login` page fill
these in for you.

## Screenshots

| Homepage | Product Detail |
|---|---|
| ![Homepage](./client/imgs/homepage.png) | ![Product detail](./client/imgs/product-details.png) |

| Buyer Dashboard | Supplier Dashboard |
|---|---|
| ![Buyer dashboard](./client/imgs/buyer-dashboard.png) | ![Supplier dashboard](./client/imgs/supplier-dashboard.png) |

| New Arrival | Best Seller |
|---|---|
| ![New Arrival](./client/imgs/new-arrival.png) | ![Best Seller](./client/imgs/best-seller.png) |

| Quote Request | Recently View Products |
|---|---|
| ![Quote Request](./client/imgs/QuoteRequest.png) | ![Recently View Products](./client/imgs/RecentlyViewProducts.png) |

| AI Assistant | Cart & Checkout |
|---|---|
| ![AI assistant](./client/imgs/ai-assistant.png) | ![Checkout](./client/imgs/checkout.png) |

---

## Features

### Buyer
- Register/login with email verification, forgot/reset password (email via Nodemailer)
- Multi-step onboarding wizard (business type, categories, fabric preferences, order scale)
- Marketplace discovery: search, category/price filters, pagination, "shop by category" grid
- Product detail: multi-image gallery with lightbox, supplier details card, ratings & reviews,
  same-category "similar products", AI Q&A about the specific product, and bulk-pricing tiers
  (per-unit price adjusts automatically for the quantity you enter)
- Wishlist (heart-toggle on any product card, dedicated page + dashboard link)
- "Recently viewed" row on the homepage and product pages — scoped to your own account, so
  switching accounts on the same browser never shows someone else's history
- Compare up to 4 products side-by-side with an AI-written comparison
- Request a custom-price quote (RFQ) on any product — a lightweight negotiation thread separate
  from checkout — then track the supplier's response and accept/decline it from the dashboard
- Browse a supplier's public storefront: verified badge, aggregate rating, and full catalog
- Cart & checkout with stock/MOQ validation (rejects over-stock quantities with a toast)
- Order tracking with a visual status stepper (Pending → Accepted → Preparing → Ready for
  Dispatch → Completed) and in-app notifications on status changes
- Dashboard: order history, saved address, password change, wishlist, quotes — all behind a
  responsive sidebar (desktop) / tab bar (mobile)

### Supplier
- Product CRUD with multi-image upload (Cloudinary), stock/MOQ management, and bulk-pricing tiers
- Quick +/- stock adjustment directly from the product list (no modal needed)
- Incoming order management with status updates (triggers buyer notifications)
- Respond to incoming buyer quote requests (RFQ) with a custom price and message; buyer is
  notified and can accept/decline
- Dashboard with live stats (products, pending orders, low-stock alerts) and an 8-week
  orders/revenue chart
- Verified-supplier badge (shown on product pages, the public storefront, and the dashboard)

### AI Marketplace Assistant
- Floating chat widget with natural-language search + voice input, grounded only in live DB data
- Personalized recommendations from the buyer's onboarding profile
- Product Q&A and side-by-side comparison, both backed by real product records — never invented

### Platform-wide
- JWT access + refresh token rotation (httpOnly refresh cookie)
- Toast notifications, skeleton loaders, responsive design throughout
- Footer with quick links, About Us, Terms & Conditions, and Privacy Policy pages

---

## Tech Stack

**Frontend** — Next.js (App Router) · Tailwind CSS · React Hook Form + Zod · Zustand · lucide-react

**Backend** — Node.js + Express · MongoDB + Mongoose · JWT (access + refresh) · Cloudinary ·
Nodemailer · Google Gemini (AI assistant)

**Deployment** — Client on Vercel; server supports both a traditional Node process (Render/Railway,
via `server.js`) and Vercel serverless functions (via `api/index.js` + `vercel.json`).

---

## Repository Structure

```
project-root/
├── client/     # Next.js + Tailwind CSS (frontend)
├── server/     # Express.js + MongoDB (backend)
└── docs/       # README assets (screenshots)
```

## Local Setup

### Server

```bash
cd server
cp .env.example .env   # fill in your own MongoDB/Cloudinary/Gemini/Gmail credentials
npm install
npm run seed:demo      # optional: creates the demo buyer/supplier + sample catalog
npm run dev            # http://localhost:5000
```

### Client

```bash
cd client
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your running server
npm install
npm run dev             # http://localhost:3000
```

See each folder's `.env.example` for the full list of required environment variables.

---

