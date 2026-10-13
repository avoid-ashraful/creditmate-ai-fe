# Storybook Publishing Setup Guide

This document describes the exact steps required to configure and enable automated Storybook publishing to **Chromatic** (for visual regression testing and component review) and **Netlify** (for public/team-accessible Storybook hosting).

---

## Prerequisites

- Admin access to the GitHub repository
- A Chromatic account (free tier available at <https://chromatic.com>)
- A Netlify account (free tier available at <https://netlify.com>)
- Node.js 20+ installed locally

---

## 1. Create a Chromatic Project & Get Tokens

1. Go to <https://chromatic.com> and sign in (or create an account).
2. Click **Create project** → select this GitHub repository.
3. Once the project is created, copy the **Project Token** (starts with `chpt_...`).
4. Copy the **Project ID** (a UUID-like string shown in the project settings URL or API settings).

### Add Chromatic secrets to GitHub

1. In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Add:
   - Name: `CHROMATIC_PROJECT_TOKEN`
   - Value: _your Chromatic project token_
3. Add:
   - Name: `CHROMATIC_PROJECT_ID`
   - Value: _your Chromatic project ID_

> **Note**: The `chromatic.config.json` file reads `projectId` from the `CHROMATIC_PROJECT_ID` environment variable via placeholder `${CHROMATIC_PROJECT_ID}`. The GitHub Actions workflow injects this via the `chromaui/action` which reads `projectToken` from `CHROMATIC_PROJECT_TOKEN` secret.

---

## 2. Create a Netlify Site & Get Tokens

### Option A: Netlify UI (Recommended)

1. Go to <https://app.netlify.com> and sign in.
2. Click **Add new site → Import an existing project** → select this GitHub repository.
3. Configure build settings:
   - **Build command**: `npm run build-storybook`
   - **Publish directory**: `storybook-static`
   - **Node version**: 20 (set in Netlify UI under Site settings → Build & deploy → Environment → `NODE_VERSION = 20`)
4. Click **Deploy site**.
5. Once deployed, go to **Site settings → General → Site details** and copy the **Site ID** (UUID).

### Option B: Netlify CLI (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site (run from repo root)
netlify init --manual

# Follow prompts:
#   - Team: your team
#   - Site name: <choose a unique name>
#   - Build command: npm run build-storybook
#   - Publish directory: storybook-static
```

### Add Netlify secrets to GitHub

1. In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Add:
   - Name: `NETLIFY_AUTH_TOKEN`
   - Value: _your Netlify personal access token_ (generate at <https://app.netlify.com/user/applications#personal-access-tokens>)
3. Add:
   - Name: `NETLIFY_SITE_ID`
   - Value: _your Netlify site ID (from step 5 above or CLI output)_

---

## 3. Verify Local Storybook Production Build

Before relying on CI, verify the production build works locally:

```bash
# From the repository root
npm run storybook:build

# Output will be in ./storybook-static/
# Verify it exists and contains index.html
ls -la storybook-static/
```

You can preview the built Storybook locally:

```bash
npx serve storybook-static -p 6006
# Open http://localhost:6006
```

> **Important**: Do not commit the `storybook-static/` directory. It is gitignored and generated fresh on each CI run.

---

## 4. How the CI Pipeline Works

The workflow `.github/workflows/storybook.yml` runs on:

- **Push to `main`** → builds Storybook, publishes to Chromatic, deploys to Netlify (production)
- **Pull requests to `main`** → builds Storybook, publishes to Chromatic (for PR review), does **not** deploy to Netlify

### Chromatic Behavior

- `onlyChanged: true` → only re-renders stories for components that changed (faster, cheaper)
- `exitZeroOnChanges: true` → CI passes even if visual changes are detected (human review required in Chromatic UI)
- `autoAcceptChanges: main` → changes on `main` branch are auto-accepted as baselines
- `exitOnceUploaded: true` → exits after upload, doesn't wait for snapshots to render

### Netlify Behavior

- Only deploys on push to `main` (not on PRs)
- Uses `nwtgck/actions-netlify@v3` for deployment
- Production branch is `main`

---

## 5. Local Development Commands

| Command                   | Description                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `npm run storybook`       | Start Storybook dev server at `http://localhost:6006`                                 |
| `npm run build-storybook` | Build production Storybook to `storybook-static/` (uses Storybook CLI default output) |
| `npm run storybook:build` | Build production Storybook explicitly to `storybook-static/` (used by CI)             |
| `npm run chromatic`       | Run Chromatic locally (requires `CHROMATIC_PROJECT_TOKEN` env var)                    |

---

## 6. Troubleshooting

### Chromatic: "Project not found" / 401

- Verify `CHROMATIC_PROJECT_TOKEN` secret is correct in GitHub
- Verify the token matches the project in Chromatic UI

### Netlify: "Site not found" / deploy fails

- Verify `NETLIFY_SITE_ID` matches the site in Netlify dashboard
- Verify `NETLIFY_AUTH_TOKEN` has access to the site/team
- Check Netlify build logs for Node version or dependency issues

### Storybook build fails in CI but passes locally

- Ensure `npm ci` runs (uses `package-lock.json`)
- Check for case-sensitive import issues (Linux vs macOS/Windows)
- Verify all story files are committed (`src/**/*.stories.@(js|jsx|ts|tsx)`)

### `actionlint` validation fails

```bash
/home/ubuntu/credit-agent-control/bin/actionlint .github/workflows/storybook.yml
```

Fix any reported syntax or schema errors before committing.

---

## 7. Security Notes

- **Never commit tokens** to the repository. All secrets are read from GitHub Actions secrets.
- `netlify.toml` contains only public configuration (headers, cache policies, build settings).
- `chromatic.config.json` uses a placeholder `${CHROMATIC_PROJECT_ID}` resolved at runtime from environment.
- Security headers in `netlify.toml`:
  - `X-Frame-Options: DENY` — prevents clickjacking
  - `X-Content-Type-Options: nosniff` — prevents MIME sniffing
  - `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
  - `Permissions-Policy` — disables camera, microphone, geolocation
  - `Content-Security-Policy` — restrictive policy allowing only self-hosted resources
- Cache policy:
  - Static assets (JS, CSS, fonts, images): 1 year, immutable
  - `index.html`: no cache, must revalidate

---

## 8. Rollback / Disable

To temporarily disable publishing:

1. Comment out the `chromatic` and `netlify` steps in `.github/workflows/storybook.yml`
2. Or remove the secrets from GitHub (stops both)

To permanently remove:

1. Delete `.github/workflows/storybook.yml`
2. Delete `netlify.toml` and `chromatic.config.json`
3. Remove `storybook:build` and `chromatic` scripts from `package.json`
4. Remove `chromatic` from `devDependencies`

---

## 9. File Summary

| File                              | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `netlify.toml`                    | Netlify build config, headers, cache policy               |
| `chromatic.config.json`           | Chromatic project config (projectId from env)             |
| `package.json`                    | Scripts: `storybook:build`, `chromatic`; dep: `chromatic` |
| `.github/workflows/storybook.yml` | CI workflow (validated by actionlint)                     |
| `docs/storybook-publishing.md`    | This document                                             |

---

**Last updated**: 2026-10-13  
**Task ID**: sbpub
