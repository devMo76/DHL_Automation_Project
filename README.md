# AI-Powered Knowledge Base Automation for DHL Logistics Operations

A full-stack web application that transforms raw, unstructured logistics content (PDF, DOCX, plain text) into structured, searchable knowledge articles. Built for the DHL Web Technology Tournament.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **UI:** Tailwind CSS 4, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage)
- **File Processing:** pdf-parse, mammoth
- **AI Processing:** OpenAI API (optional) with deterministic fallback
- **Validation:** Zod, React Hook Form

## Features

- **Upload Console** — Upload PDF, DOCX, or paste raw text
- **AI Draft Generation** — Automatically generates title, summary, procedure steps, and tags
- **Knowledge Base Viewer** — Search and filter articles by status, tags, and keywords
- **Status Workflow** — Draft → Reviewed → Published (admin-only status control)
- **Version History** — Every edit creates a version snapshot with full audit trail
- **Duplicate Detection** — Exact hash match + title similarity check
- **Role-Based Access** — Editors edit content, Admins control status
- **RPA-Ready** — Clean API endpoints for UiPath/automation integration

## Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works)

## Setup

### 1. Clone and install

```bash
cd dhl_project
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from Settings → API

### 3. Configure environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: for real AI processing (leave empty for fallback processor)
OPENAI_API_KEY=
```

### 4. Run database schema

Go to Supabase Dashboard → SQL Editor → New Query and run the full schema SQL (creates 8 tables with RLS policies, indexes, and the auto-profile trigger).

### 5. Create storage bucket

Go to Supabase Dashboard → Storage → New Bucket:
- Name: `uploads`
- Visibility: Private

### 6. Create test users

Go to Supabase Dashboard → Authentication → Users → Add User:

**Editor:**
- Email: `editor@test.com`
- Password: `password123`
- Auto Confirm: Yes

**Admin:**
- Email: `admin@test.com`
- Password: `password123`
- Auto Confirm: Yes

Then go to Table Editor → `profiles` table and set:
- `editor@test.com` → role: `editor`, full_name: `Test Editor`
- `admin@test.com` → role: `admin`, full_name: `Test Admin`

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing Guide

### Login
1. Open `http://localhost:3000` → redirected to login page
2. Log in with `editor@test.com` or `admin@test.com`

### Upload Flow
1. Go to `/dashboard/upload`
2. **Text:** Click "Paste Text" tab → paste logistics content → click "Generate Draft"
3. **File:** Drag and drop a PDF or DOCX → click "Upload & Generate Draft"
4. You'll be redirected to the article detail page with AI-generated content

### Article Management
1. Go to `/dashboard/articles` → see all articles in a table
2. Use the search box to filter by title
3. Click status buttons (All/Draft/Reviewed/Published) to filter
4. Click tag badges to filter by tag
5. Click any article to see full details

### Edit Flow
1. Open any article → click the "Edit" tab
2. Change title, summary, add/remove steps, add/remove tags
3. Click "Save Changes" → creates a new version
4. Check "History" tab to see version timeline

### Status Workflow (Admin only)
1. Log in as `admin@test.com`
2. Open a draft article → click "Mark as Reviewed"
3. Click "Publish" → article is now published
4. Click "Unpublish" → reverts to draft
5. Log in as `editor@test.com` → status buttons are hidden (shows "Admin only")

### Duplicate Detection
1. Upload the same text content twice
2. The second upload will show a duplicate warning toast
3. The article will be flagged with a duplicate badge

## Project Structure

```
app/
  (auth)/login/          — Login page
  (dashboard)/dashboard/ — Protected dashboard pages
    page.tsx             — Dashboard with stats
    upload/              — Upload console
    articles/            — Article list + detail
    draft/[id]/          — Redirect to articles
  api/
    process-upload/      — Upload + AI processing
    articles/            — CRUD + status + versions
    auth/callback/       — Supabase auth callback

components/
  layout/     — Sidebar, header, nav
  articles/   — Status badge, actions, editor, history
  ui/         — shadcn/ui components

lib/
  supabase/   — Client, server, admin, middleware
  ai/         — Processor (real + fallback)
  files/      — PDF, DOCX extraction
  duplicate/  — Hash + similarity checker
  auth/       — Server actions
  normalize.ts — Text normalization + hashing
```

## Role Policy

| Action | Editor | Admin |
|--------|--------|-------|
| Upload content | ✅ | ✅ |
| Edit article content | ✅ | ✅ |
| Create new versions | ✅ | ✅ |
| Mark as Reviewed | ❌ | ✅ |
| Publish | ❌ | ✅ |
| Unpublish / Revert | ❌ | ✅ |

## API Endpoints (RPA-Ready)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/process-upload` | Upload and process content |
| GET | `/api/articles` | List articles (search, filter) |
| GET | `/api/articles/:id` | Get article details |
| PATCH | `/api/articles/:id` | Edit article content |
| PATCH | `/api/articles/:id/status` | Change article status |
| GET | `/api/articles/:id/versions` | Get version history |
