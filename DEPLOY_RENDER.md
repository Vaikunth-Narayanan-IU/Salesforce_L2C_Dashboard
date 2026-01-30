# Deploy to Render (Static Site)

This project is a **Next.js 14 App Router** app configured for **static export** (`output: "export"`). Render will host the generated `out/` directory as a static site.

## 1) Prereqs / notes

- **Node version**: Use **Node 18 or Node 20** on Render (recommended).
- **No server runtime**: Static export means no API routes and no server-side runtime at request time.
- **Data constraint**: The app uses only:
  - a bundled CSV in `public/sample/`, or
  - a CSV uploaded in the browser.

## 2) Repo configuration (already included)

- `next.config.mjs`:
  - `output: "export"` enables static export
  - `images.unoptimized: true` avoids Next Image optimization requirements on static hosts
  - `trailingSlash: true` exports routes like `/about/index.html` for static hosts
- `render.yaml`:
  - Builds with `npm ci && npm run build`
  - Publishes `out/`
  - Render's Blueprint key is `staticPublishPath` (equivalent to a "publish dir")

## 3) Render deployment steps

1. Push this repo to GitHub (or GitLab).
2. In Render:
   - Click **New +** → **Static Site**
   - Select the repo/branch
3. Configure:
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `out`
   - **Node Version**: 18 or 20
4. Deploy.

## 4) Verify the export output

After a successful build, you should see an `out/` folder at the repo root containing:

- `out/index.html`
- `out/about/index.html`
- `out/_next/*` (JS/CSS bundles)
- `out/sample/l2o_funnel_synthetic_dataset.csv` (bundled sample CSV)

## 5) SPA routing / redirects

This app exports **two real HTML routes** (`/` and `/about`) and uses Next.js client-side navigation between them.

- A global SPA fallback rewrite like `/* /index.html 200` is **not required** and can be harmful (it may cause `/about` to serve the home page).
- If you later add client-only routes that don't exist as exported HTML files, then consider adding a platform-specific rewrite. For this repo today, skip it.

## 6) Warnings specific to Next static export

- **`next export` CLI**: In Next.js 14, `next export` was removed. `output: "export"` makes `next build` generate `out/`.
- **No API routes**: You cannot rely on `app/api/*` or server endpoints on Render Static.
- **No Server Actions requiring runtime**: Server Actions that depend on a server runtime won't work.
- **Dynamic rendering restrictions**: Truly dynamic routes must be pre-renderable at build time for export.

