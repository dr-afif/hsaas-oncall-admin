# HSAAS Oncall Roster Manager

A modern, vanilla JS application for managing hospital oncall rosters.

## Tech Stack
-   **Frontend**: Plain HTML, CSS, Javascript (Vanilla).
-   **Auth**: Auth0 (OIDC).
-   **Database**: Supabase (PostgreSQL with RLS).
-   **Hosting**: Compatible with any static hosting (GitHub Pages, Cloudflare Pages, etc.).

## Setup Instructions

### 1. Supabase Setup
1.  Create a new Supabase project.
2.  Run the SQL scripts in the `/sql` directory in order:
    -   `01_schema.sql` (Tables and basic constraints)
    -   `02_rls.sql` (Security policies and JWT helpers)
    -   `03_audit_triggers.sql` (Audit logging triggers)
3.  Go to **Project Settings > API** and copy your **Project URL** and **anon public key**.

### 2. Google Auth Setup (Direct)
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project and go to **APIs & Services > Credentials**.
3.  Create an **OAuth 2.0 Client ID** (Web application).
4.  Add your Supabase internal URL to the **Authorized redirect URIs** (find this in Supabase: **Authentication > Providers > Google**).
5.  In Supabase, go to **Authentication > Providers > Google**.
6.  Enable the provider and paste your **Client ID** and **Client Secret** from Google.
7.  Copy the **Callback URI** from Supabase and add it to your Google Cloud Console "Authorized redirect URIs".

### 3. Application Configuration

#### Local Testing
1.  Copy `public/js/config.example.js` to `public/js/config.js`.
2.  Fill in your actual Supabase URL and Anon Key.
3.  `public/js/config.js` is ignored by Git, so your keys won't be committed.

#### Production (via GitHub Secrets)
1.  Go to your GitHub Repository **Settings > Secrets and variables > Actions**.
2.  Add the following secrets:
    *   `SUPABASE_URL`: Your Supabase Project URL.
    *   `SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.
    *   `CLOUDFLARE_API_TOKEN`: Created in Cloudflare dashboard (Account > API Tokens).
    *   `CLOUDFLARE_ACCOUNT_ID`: Found in Cloudflare dashboard.
3.  The GitHub Action in `.github/workflows/deploy.yml` will automatically create the `config.js` file during deployment and push it to Cloudflare Pages.

### 4. Seeding Admin
1.  Go to Supabase SQL Editor.
2.  Run the content of `sql/04_seed_admin.sql` (after replacing the email with your actual Auth0 login email).

### 5. Local Testing
1.  Serve the `public` directory using a local web server (e.g., `npx serve public` or VS Code Live Server).
2.  Navigate to `/login.html`.

## Key Features
-   **Excel-like Paste**: Supports copying multi-column data from Excel/Word and pasting directly into the grid.
-   **Optimistic Locking**: Prevents overwriting changes if two people edit the same roster simultaneously.
-   **Audit Logging**: Every single change (INSERT/UPDATE/DELETE) is tracked with the actor's identity and before/after snapshots.
-   **Versioned Slots**: Define different roster structures for different months without breaking historical data.
-   **Security**: All access is governed by Row Level Security (RLS) in Postgres.