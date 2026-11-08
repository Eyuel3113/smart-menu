# Smart Menu Deployment & CI/CD Guide (Render + Vercel)

This project is configured as a clean monorepo:
- **Backend**: Express + Socket.io + Prisma $\rightarrow$ **Render** (supports WebSockets & long-lived connections)
- **Frontend**: Next.js 16 + Tailwind CSS $\rightarrow$ **Vercel** (fast edge CDN & server-rendered client)

---

## 1. Push Code to GitHub

If you haven't pushed your repository to GitHub yet:

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `smart-menu`).
2. Link your local repo and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/smart-menu.git
git push -u origin main
```

---

## 2. Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository (`smart-menu`).
3. Fill in the following service details:
   - **Name**: `smart-menu-api` (or your choice)
   - **Region**: Closest to your database (e.g., Frankfurt/Oregon)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:push && npm start`
   - **Plan**: Free (or Starter for production zero-sleep)

4. **Environment Variables**: Add these in the Render "Environment" tab:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render port (or left to Render default) |
   | `DATABASE_URL` | *Your PostgreSQL Connection String* | Neon / Supabase / Render Postgres |
   | `JWT_SECRET` | *(Random 32-char string)* | e.g. run `openssl rand -hex 32` |
   | `CUSTOMER_JWT_SECRET` | *(Random 32-char string)* | e.g. run `openssl rand -hex 32` |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` | Vercel domain (or update after step 3) |

5. Click **Create Web Service**.
6. Once deployed, copy your Render service URL (e.g., `https://smart-menu-api.onrender.com`).

---

## 3. Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
2. Select your GitHub repository (`smart-menu`).
3. In the project configuration screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select **`client`**
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables**: Add this variable:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://smart-menu-api.onrender.com` (Your Render URL from step 2) |

5. Click **Deploy**.

---

## 4. How CI/CD Works

Now, every time you push changes to your `main` branch:
1. **GitHub** receives your commits:
   ```bash
   git add .
   git commit -m "update feature"
   git push origin main
   ```
2. **Vercel** automatically triggers a build and deploys the frontend.
3. **Render** automatically detects changes, rebuilds, pushes Prisma schema updates, and redeploys the backend.
