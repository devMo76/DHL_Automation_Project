# DHL Knowledge Base Automation System

## Project Overview

The DHL Knowledge Base Automation System is a web application for converting raw logistics information into structured knowledge base articles. It supports authenticated users, document/text upload, article editing, status management, version history, and an administrative view for RPA extraction results.

The project was built for a university Web Technology assignment using Next.js, TypeScript, Supabase, and PostgreSQL. It focuses on a realistic DHL logistics workflow where unstructured information can be stored, reviewed, and managed as reusable operational knowledge.

## Main Features

- User authentication through Supabase Auth.
- Role-based profile records for `editor`, `reviewer`, and `admin`.
- Upload console for plain text, PDF, DOCX, and supported image files.
- Text extraction from uploaded files.
- AI-assisted draft generation with deterministic fallback processing.
- Knowledge article listing with search and filters.
- Article detail page with summary, procedure steps, tags, source document text, edit form, and history.
- Article version snapshots after edits.
- Status workflow for `draft`, `reviewed`, and `published` articles.
- Admin-only article deletion endpoint.
- RPA extraction results page for administrators.
- RPA document summarization endpoint using Gemini.
- Supabase Row Level Security policies for database access control.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn-style UI components |
| Backend | Next.js App Router API routes |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Validation | Zod |
| File Parsing | `pdf-parse`, `mammoth`, `tesseract.js` |
| AI Support | Gemini API, optional OpenAI API fallback |
| Tooling | ESLint, npm |

## System Roles

### editor

Editors are standard authenticated users. They can upload raw content, create draft articles, view articles, and edit articles they are allowed to update. In the current API logic, article editing is allowed for admins or for the original creator while the article is still in `draft` status.

### reviewer

The `reviewer` role exists in the database profile model for review-based workflows. It can be used to separate review users from editors and admins. The current implemented status transition endpoint is admin-only, so reviewer-specific transition permissions would require an additional policy/API update.

### admin

Admins have elevated permissions. In the current implementation, admins can:

- Change article status.
- Delete articles through the API.
- Access RPA extraction results.
- Delete RPA extracted document records.
- Generate or regenerate AI summaries for RPA extracted documents.

## Database Overview

The database schema is located in [`supabase/schema.sql`](supabase/schema.sql). Row Level Security policies are located in [`supabase/policies.sql`](supabase/policies.sql).

### `profiles`

Stores application profile information linked to Supabase Auth users.

Main fields:

- `id`
- `full_name`
- `email`
- `role`
- `created_at`

### `source_documents`

Stores uploaded or pasted source content before it becomes a knowledge article.

Main fields:

- `id`
- `original_name`
- `file_type`
- `storage_path`
- `extracted_text`
- `normalized_text`
- `content_hash`
- `uploaded_by`
- `uploaded_at`

### `knowledge_articles`

Stores the main knowledge article records.

Main fields:

- `id`
- `title`
- `summary`
- `status`
- `creator_id`
- `source_document_id`
- `current_version_number`
- `duplicate_flag`
- `conflict_flag`
- `created_at`
- `updated_at`

### `article_steps`

Stores ordered procedure steps for an article.

Main fields:

- `id`
- `article_id`
- `step_number`
- `step_text`

### `article_tags`

Stores tags assigned to knowledge articles.

Main fields:

- `id`
- `article_id`
- `tag_name`

### `article_versions`

Stores version snapshots when article content is changed.

Main fields:

- `id`
- `article_id`
- `version_number`
- `title`
- `summary`
- `status_at_that_time`
- `edited_by`
- `change_note`
- `snapshot_json`
- `created_at`

### `status_history`

Stores the article status transition history.

Main fields:

- `id`
- `article_id`
- `old_status`
- `new_status`
- `changed_by`
- `changed_at`
- `note`

### `processing_logs`

Stores processing events such as extraction and AI processing logs.

Main fields:

- `id`
- `source_document_id`
- `document_storage_path`
- `stage`
- `message`
- `level`
- `created_at`

### `rpa_extracted_documents`

Stores document extraction records created for the RPA results workflow.

Main fields:

- `id`
- `processing_log_id`
- `document_url`
- `file_name`
- `file_type`
- `extracted_text`
- `extraction_status`
- `error_message`
- `ai_summary`
- `ai_key_points`
- `ai_summary_status`
- `summarized_at`
- `extracted_at`

## API Endpoints

Most API routes require an authenticated Supabase session. Examples below show JSON structure and URL usage. Replace `:id` with a real article UUID.

### `GET /api/articles`

Lists knowledge articles and supports filters.

Example:

```http
GET /api/articles?status=draft&search=customs&tag=shipping
```

Successful response:

```json
[
  {
    "id": "article-uuid",
    "title": "Customs Documentation Procedure",
    "status": "draft",
    "creator_id": "user-uuid",
    "article_tags": [
      { "tag_name": "shipping" }
    ]
  }
]
```

### `GET /api/articles/:id`

Returns a single article with steps, tags, and creator profile information.

Example:

```http
GET /api/articles/00000000-0000-0000-0000-000000000003
```

Successful response:

```json
{
  "id": "00000000-0000-0000-0000-000000000003",
  "title": "DHL Shipment Issue Handling Procedure",
  "summary": "This article explains shipment issue handling.",
  "status": "draft",
  "article_steps": [
    {
      "step_number": 1,
      "step_text": "Receive the shipment issue details."
    }
  ],
  "article_tags": [
    {
      "tag_name": "shipment"
    }
  ]
}
```

### `PATCH /api/articles/:id`

Updates article content and creates a new version record.

Example request:

```http
PATCH /api/articles/00000000-0000-0000-0000-000000000003
Content-Type: application/json
```

```json
{
  "title": "Updated DHL Shipment Issue Handling Procedure",
  "summary": "Updated summary for the article.",
  "steps": [
    "Receive shipment issue details.",
    "Verify the tracking number.",
    "Assign the case to the correct department."
  ],
  "tags": ["shipment", "support", "tracking"],
  "changeNote": "Updated procedure steps"
}
```

Successful response:

```json
{
  "success": true,
  "version": 2
}
```

### `DELETE /api/articles/:id`

Deletes an article. This endpoint is restricted to admins.

Example:

```http
DELETE /api/articles/00000000-0000-0000-0000-000000000003
```

Successful response:

```json
{
  "message": "Article deleted successfully",
  "deletedArticle": {
    "id": "00000000-0000-0000-0000-000000000003",
    "title": "DHL Shipment Issue Handling Procedure"
  }
}
```

### `PATCH /api/articles/:id/status`

Changes the status of an article. This endpoint is restricted to admins.

Allowed transitions:

| Current Status | Allowed Next Status |
| --- | --- |
| `draft` | `reviewed` |
| `reviewed` | `published`, `draft` |
| `published` | `draft` |

Example request:

```http
PATCH /api/articles/00000000-0000-0000-0000-000000000003/status
Content-Type: application/json
```

```json
{
  "newStatus": "reviewed",
  "note": "Article checked and ready for publishing review."
}
```

Successful response:

```json
{
  "success": true,
  "oldStatus": "draft",
  "newStatus": "reviewed"
}
```

## Article Filters

The `GET /api/articles` endpoint supports the following query parameters:

| Filter | Description | Example |
| --- | --- | --- |
| `status` | Filters articles by workflow status. Supported values are `draft`, `reviewed`, `published`, or `all`. | `/api/articles?status=published` |
| `search` | Searches article titles using a case-insensitive match. | `/api/articles?search=customs` |
| `tag` | Filters articles by exact tag name after articles are fetched. | `/api/articles?tag=shipping` |
| `creatorId` | Filters articles by creator UUID. | `/api/articles?creatorId=user-uuid` |
| `from` | Filters articles created on or after a date or timestamp. | `/api/articles?from=2026-05-01` |
| `to` | Filters articles created up to the end of the given date. | `/api/articles?to=2026-05-25` |

Filters can be combined:

```http
GET /api/articles?status=draft&search=parcel&tag=warehouse&from=2026-05-01&to=2026-05-25
```

## Environment Variables

Use `.env.example` as the template for local configuration. Create a `.env.local` file in the project root and fill in your own values.

Required keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional key:

```env
OPENAI_API_KEY=your_openai_api_key
```

Notes:

- Do not commit `.env.local`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Use `.env.example` only for placeholder values.

## How to Run the Project Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and replace placeholder values with your own Supabase and AI API keys.

### 3. Set up Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/policies.sql`.
5. Optionally run `supabase/seed.sql` for demo data.

### 4. Create the storage bucket

In Supabase Storage, create a bucket named:

```text
uploads
```

The application uploads source documents to this bucket.

### 5. Create test users

Create users in Supabase Authentication, then update their rows in the `profiles` table with suitable roles such as `editor` or `admin`.

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 7. Production build check

```bash
npm run build
```

### 8. Lint check

```bash
npm run lint
```

## Security Features

- **Supabase authentication:** Protected pages and API routes check the current Supabase user session.
- **Row Level Security:** SQL policy files enable database-level access control for application tables.
- **Admin-only delete:** `DELETE /api/articles/:id` requires an authenticated admin profile.
- **Admin-only status changes:** `PATCH /api/articles/:id/status` requires an authenticated admin profile.
- **Status validation:** Article status transitions are restricted to valid workflow movements.
- **UUID validation:** Article and document IDs are validated before database queries.
- **Zod request validation:** Article update and status update payloads are validated before processing.
- **Server-only service role usage:** Service role access is kept in server-side code for admin-level operations.
- **Environment isolation:** Real secrets should be stored in `.env.local`, which is excluded from Git.

## Testing Checklist

Use this checklist before submission or demonstration.

- Login works for a valid Supabase user.
- Unauthenticated users are redirected away from protected dashboard pages.
- Text upload creates a draft article.
- PDF upload extracts text and creates a draft article.
- DOCX upload extracts text and creates a draft article.
- Image upload works when OCR language data is available.
- Article list loads successfully.
- Article search by title works.
- Status filter works.
- Tag filter works.
- Creator filter works through the API.
- Date range filters work through the API.
- Article detail page displays summary, steps, tags, and source text.
- Article edit creates a new version.
- Version history displays saved article versions.
- Admin can move an article from `draft` to `reviewed`.
- Admin can move an article from `reviewed` to `published`.
- Invalid status transitions are rejected.
- Non-admin users cannot change article status.
- Admin can delete an article through the API.
- Non-admin users cannot delete articles.
- RPA results page is restricted to admins.
- RPA summary generation works when `GEMINI_API_KEY` is configured.
- `npm run lint` passes.
- `npm run build` passes.

## Future Improvements

- Add a dedicated reviewer workflow where reviewers can approve drafts separately from admins.
- Add a visible delete button in the article management UI for admins.
- Add API-key-based RPA ingestion endpoints for UiPath integration.
- Add automated tests for API routes and role permissions.
- Add stronger database cascade rules or transaction handling for article deletion.
- Add more detailed audit fields such as reviewed by, published by, and final approval note.
- Add pagination for large article lists.
- Add full-text search across title, summary, steps, and extracted source text.
- Add export options for published knowledge articles.
- Add dashboard charts for article status counts and processing activity.
