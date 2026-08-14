# Deploying Echo to Vercel + GitHub

Echo is configured for a real production deploy: **PostgreSQL** for data and **Vercel Blob** for uploaded media. Total time: ~5–10 minutes. You'll do the clicks that need your accounts; everything in the code is already done.

---

## 1 · Put the code on GitHub

From the unzipped `echo` folder:

```bash
git init
git add .
git commit -m "Echo — initial commit"

# Option A: GitHub CLI (creates the repo + pushes in one go)
gh repo create echo --public --source=. --push

# Option B: create an empty repo at github.com/new named "echo", then:
git remote add origin https://github.com/<your-username>/echo.git
git branch -M main
git push -u origin main
```

> `.env` is git-ignored, so your secrets never get pushed.

## 2 · Create a free Postgres database (Neon)

1. Go to **https://neon.tech** → sign in → **Create project**.
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).

(You can also use **Vercel Postgres** — Storage → Create → Postgres — which wires `DATABASE_URL` in automatically.)

## 3 · Import the repo into Vercel

1. **https://vercel.com/new** → import your `echo` GitHub repo.
2. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `AUTH_SECRET` | a long random string — run `openssl rand -hex 32` |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` (you can update after the first deploy) |

3. Click **Deploy**. The build runs `prisma db push`, which **creates all the tables automatically**.

## 4 · Add media storage (Vercel Blob)

1. In your Vercel project → **Storage** → **Create Database** → **Blob**.
2. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project automatically.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so uploads use Blob.

> Without a Blob token the app still runs — image/video **uploads** just won't work in production (everything else does). Seed media uses external placeholder URLs, so the site looks alive immediately.

## 5 · Get an admin account

Your live site accepts real sign-ups right away. To reach the `/admin` dashboard you need an admin:

**Option A — seed demo data + a ready admin** (great for a first look):

```bash
# locally, pointed at your production DB:
# put the Neon URL in .env as DATABASE_URL, then:
npm install
npm run db:seed
# demo logins → admin / password123 , maya / password123
```

**Option B — promote your own account** (best for a real site):

```bash
# after signing up on the live site:
DATABASE_URL="<your-neon-url>" npm run make-admin -- <your-username>
```

---

## One-click deploy button

After your repo is on GitHub, this button (also in the README — replace `<your-username>`) lets anyone deploy their own copy:

```
https://vercel.com/new/clone?repository-url=https://github.com/<your-username>/echo&env=DATABASE_URL,AUTH_SECRET,BLOB_READ_WRITE_TOKEN&project-name=echo&repository-name=echo
```

## Troubleshooting

- **Build fails on `prisma db push`** → `DATABASE_URL` is missing or wrong in Vercel env vars.
- **Uploads fail in production** → add a Vercel Blob store (step 4) and redeploy.
- **Can't open `/admin`** → your account isn't an admin yet (step 5).
- **Emails**: verification/reset links print to the server logs (Vercel → Deployment → Functions logs) unless you wire an email provider. Sign-up works without email verification.
