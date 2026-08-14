# Echo — _Share what echoes._

A modern, full-stack social platform inspired by the core experience of photo-sharing apps, with its own original branding, dark-first UI, and identity. **Not a mockup** — it ships with a real backend, a persistent database, real authentication, file-based media storage, and near-real-time messaging & notifications.

![Echo](https://img.shields.io/badge/Echo-Share%20what%20echoes-7c5cff)

---

## ✨ Highlights

- **Auth** — sign up, log in/out, secure server sessions (httpOnly), remember-me, forgot/reset password, email verification, live username availability.
- **Home feed** — personalised, infinite scroll, stories bar, likes / comments / saves / share, double-tap to like, carousels, post options.
- **Create** — drag-and-drop multi-upload with progress, captions, #hashtags, @mentions, user tags, location, disable comments, edit caption, delete, publish as an **Echo Clip**.
- **Stories** — photo / video / text, 24-hour expiry, tap-through viewer with progress bars, replies, reactions, and owner-only view counts.
- **Explore** — recommendation grid, trending hashtags, recommended creators, categories, hashtag pages, hover stats.
- **Search** — people, hashtags, posts and locations, with recent searches.
- **Profiles** — posts / clips / tagged / saved tabs, followers & following, follow / unfollow, private accounts + requests, edit profile, block / mute / restrict / report.
- **Echo Messages** — 1:1 & group DMs, images, GIFs, emoji, replies, reactions, unsend, typing indicators, read receipts, online status, conversation search (polling-based real-time).
- **Notifications** — likes, comments, replies, follows, requests, mentions, tags, messages; mark-as-read.
- **Echo Clips** — full-screen vertical short video with autoplay-on-visible.
- **Settings** — account, privacy, notifications, appearance (dark / light / system), security (active sessions & login history, 2FA flag), blocked/muted/restricted lists.
- **Safety & moderation** — report posts/comments/accounts, block/mute/restrict, community guidelines.
- **Admin** — protected `/admin` dashboard: platform stats, 7-day activity, moderation queue, remove content, suspend/ban/verify users, user search. Normal users are redirected away.
- **Production polish** — skeleton loaders, toasts, empty & error states, confirm dialogs, smooth animations, fully responsive (desktop sidebar + mobile bottom nav).

## 🧱 Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | **Next.js 14** (App Router, React 18, TypeScript) |
| Database   | **Prisma ORM + PostgreSQL** (Neon / Vercel Postgres) |
| Auth       | Custom opaque sessions (bcrypt hashing, httpOnly cookies) |
| Styling    | **Tailwind CSS** with a CSS-variable theming system |
| Media      | **Vercel Blob** object storage in production; local disk in dev |
| Realtime   | Optimistic UI + polling (swap for websockets/SSE later) |

---

## 🚀 Quick start (local)

> Requires **Node 18+** (Node 20/22 recommended) and a PostgreSQL database.
> The easiest free option is a [Neon](https://neon.tech) database — create one and copy its connection string.

```bash
# 1. install dependencies
npm install

# 2. add your Postgres URL to .env  (copy .env.example → .env first)
#    DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# 3. generate the client, create tables, and seed demo data
npm run setup

# 4. start the dev server
npm run dev
```

Open **http://localhost:3000**.

## ☁️ Deploy to Vercel + GitHub

See **[DEPLOY.md](./DEPLOY.md)** for the full 5-step guide (GitHub → Neon → Vercel → Blob → admin).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/loxywastaken/echo&env=DATABASE_URL,AUTH_SECRET,BLOB_READ_WRITE_TOKEN&project-name=echo&repository-name=echo)

> This button points at `github.com/loxywastaken/echo` — it works once you've pushed the repo (step 1 of [DEPLOY.md](./DEPLOY.md)).

### Demo accounts (password: `password123`)

| Username | Role  |
|----------|-------|
| `maya`   | verified creator (rich feed, DMs, notifications) |
| `admin`  | **admin** — can open `/admin` |
| `aisha`, `leo`, `amara`, `kai`, `noah`, `sofia`, `theo` | regular users |
| `ines`   | private account (has a pending follow request from maya) |

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Run the production build |
| `npm run setup` | `prisma generate` + `db push` + seed (first-run) |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:reset` | Wipe + recreate + reseed the database |

## ⚙️ Environment

`.env` ships with working defaults for local dev:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEV_EMAIL_TO_CONSOLE="true"   # verification/reset links print to the server console
```

Because `DEV_EMAIL_TO_CONSOLE=true`, sign-up verification links and password-reset links are printed to your terminal (and the sign-up/forgot flows surface them in dev) instead of being emailed — no SMTP required.

## 🗂️ Project structure

```
prisma/
  schema.prisma      # every entity: users, posts, media, likes, comments,
                     # follows, requests, stories, views, messages,
                     # conversations, notifications, saves, hashtags,
                     # reports, blocks, mutes, restricts, sessions, tokens
  seed.ts            # demo users, posts, clips, stories, chats, notifications
src/
  app/
    (auth)/          # login, signup, forgot/reset password, verify email
    (main)/          # feed, explore, clips, messages, notifications,
                     # settings, guidelines, /[username] profiles, /p/[id]
    admin/           # protected admin dashboard
    api/             # ~45 route handlers (the backend)
  components/        # UI primitives, post/story/message/profile/admin views
  context/           # Auth, Theme, Toast providers
  lib/               # db, auth, storage, validators, serializers, social graph
  middleware.ts      # edge auth gate
```

## 📝 Notes & production path

- **Database**: SQLite is used for zero-config local dev. For production, change the `datasource` provider in `prisma/schema.prisma` to `postgresql`, set `DATABASE_URL`, and run `prisma migrate`.
- **Media storage**: uploads are written to `public/uploads` as real files (never as DB blobs). Point `lib/storage.ts` at S3/GCS to move to object storage.
- **Real-time**: messages, notifications and counts use optimistic updates + light polling. Drop in Socket.IO or Server-Sent Events for push.
- **Seed media** references remote placeholder images/videos so the demo looks alive on first run; your own uploads are local.
- **Security**: sessions are opaque tokens stored hashed server-side (sha256), set as httpOnly cookies; passwords are bcrypt-hashed. Change `AUTH_SECRET` in production.

---

Built as **Echo** — takes inspiration from modern photo-sharing apps while keeping its own distinctive brand and design.
