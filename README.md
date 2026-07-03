# SaaS Starter Kit

A **production-ready foundation** for building subscription SaaS products — so you don’t rebuild auth, billing, teams, and admin tools from scratch every time.

Use it as a client deliverable, a portfolio piece, or the base for your own product.

---

## What this project is

This kit ships a full-stack SaaS app with:

| Layer | Stack |
|--------|--------|
| **Web app** | React (Vite) + JSX |
| **API** | Node.js, Express, TypeScript |
| **Database** | Firebase Firestore |
| **Payments** | Stripe subscriptions |
| **Mobile** | React Native screens (shared patterns) |

It’s designed for freelancers and agencies who need to **launch faster** and show clients a real, working product — not a mockup.

---

## Purpose

Most SaaS projects need the same core pieces:

- Sign up / login (email + Google)
- Plans and billing
- User dashboard
- Admin tools
- Teams and invites
- API access for power users

This starter kit implements those features end-to-end so you can focus on **your product’s unique value**, not boilerplate.

Ideal for:

- **Upwork / freelance** — sell “SaaS MVP” or “subscription app” projects with a strong demo
- **Startups** — validate an idea with real auth and payments
- **Learning** — study a clean routes → controllers → services architecture

---

## Features

### Authentication & accounts
- Email/password registration and login
- Google OAuth
- JWT access + refresh tokens
- Profile management and account deletion
- First-time **onboarding wizard**

### Billing & plans
- Free / Pro / Enterprise tiers
- Stripe Checkout and webhooks
- Plan-based route protection
- Usage limits (API calls per day) with a live usage meter

### Product UI
- Marketing **landing page**
- Dashboard with animated stats
- Billing, profile, team, API keys, and integrations tabs
- **Dark mode** (saved per user)
- Responsive layout and smooth page transitions

### Teams & collaboration
- Create a team (Pro+)
- Invite members by email
- Accept invite flow (redirects to signup when needed)
- Owners manage members; members can view the team

### Developer & enterprise tools
- API key generation and revocation (Pro+)
- Outgoing webhooks with HMAC signatures (Enterprise)
- Slack notifications (platform + per-user webhook URL)
- Admin panel for user management (admin + Enterprise)

### Mobile
- React Native screens aligned with the web app patterns

---

## Screenshots (Upwork / portfolio)

Screenshots are kept **locally only** (not in this GitHub repo) under `docs/screenshots/`.

Suggested gallery shots: landing, login, dashboard (light & dark), billing, team, integrations, API keys, profile.

With the app running, regenerate them locally:

```bash
npm run screenshots
```

---

## Project structure

```
SaaS Starter Kit/
├── backend/          # Express + TypeScript API
├── frontend/         # React (Vite) web app
├── mobile/           # React Native screens
├── docs/screenshots/ # Local portfolio images (gitignored)
├── scripts/          # Local tooling (gitignored)
├── firestore.rules
├── firestore.indexes.json
└── package.json      # Root scripts
```

**Backend layering:** `routes → controllers → services` (Firestore only in services).

---

## Quick start

```bash
# Install dependencies
npm run install:all

# Configure environment (copy examples, then fill secrets)
# backend/.env  and  frontend/.env

# Terminal 1 — API
npm run dev:backend      # http://localhost:5000

# Terminal 2 — Web
npm run dev:frontend     # http://localhost:5173

# Create admin user (after Firebase is set up)
npm run seed:admin
```

---

## Configuration (summary)

You need:

1. **Firebase** — project + Firestore + service account credentials in `backend/.env`
2. **JWT secrets** — long random strings in `backend/.env`
3. **Stripe** — secret key, Pro/Enterprise price IDs, webhook secret
4. **Frontend** — `VITE_API_URL=http://localhost:5000`
5. **Optional** — Google OAuth client ID, Gmail App Password for SMTP, Slack webhook URL

### Gmail SMTP (invites & welcome emails)

Use an [App Password](https://myaccount.google.com/apppasswords) (not your normal Gmail password):

```env
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=you@gmail.com
NODEMAILER_PASS=your_16_char_app_password
NODEMAILER_FROM=you@gmail.com
```

If SMTP is not configured, invites still work — the accept link is logged in the backend console.

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:5000/webhook/stripe
```

---

## Main API areas

| Area | Examples |
|------|----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/google` |
| User | `/user/profile`, `/user/preferences`, `/user/onboarding` |
| Billing | `/billing/subscribe`, `/billing/status`, `/billing/cancel` |
| Team | `/team/create`, `/team/invite`, `/team/members` |
| Usage | `/usage/today` |
| API keys | `/apikeys` |
| Webhooks | `/webhooks` (outgoing), `/webhook/stripe` (Stripe) |
| Admin | `/admin/users` |

---

## Plans at a glance

| | Free | Pro | Enterprise |
|--|------|-----|------------|
| Dashboard | ✓ | ✓ | ✓ |
| API calls / day | 10 | 1,000 | Unlimited |
| Teams & invites | — | ✓ | ✓ |
| API keys | — | ✓ | ✓ |
| Outgoing webhooks | — | — | ✓ |
| Admin panel | — | — | Admin role |

---

## Production checklist

- [ ] `NODE_ENV=production`
- [ ] Stripe **live** keys and webhook endpoint
- [ ] `CLIENT_URL` points to your live frontend
- [ ] Build & deploy: `npm run build:frontend` / `npm run build:backend`
- [ ] Never commit `.env` or Firebase service account JSON

---

## License / use

Built as a reusable starter for portfolio and client work. Customize branding, plans, and features for each project.

---

## Support

If something fails on first run, check:

| Symptom | Likely fix |
|---------|------------|
| Backend won’t start | Firebase credentials in `backend/.env` |
| Google button missing | `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` |
| Checkout fails | Stripe price IDs and secret key |
| Plan not updating | Stripe CLI webhook forwarding |
| Email errors | Gmail App Password (not account password) |
| Admin panel blocked | Seed admin, then log in again |
