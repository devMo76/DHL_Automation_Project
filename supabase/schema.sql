-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  step_number integer NOT NULL,
  step_text text NOT NULL,
  CONSTRAINT article_steps_pkey PRIMARY KEY (id),
  CONSTRAINT article_steps_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id)
);
CREATE TABLE public.article_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  tag_name text NOT NULL,
  CONSTRAINT article_tags_pkey PRIMARY KEY (id),
  CONSTRAINT article_tags_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id)
);
CREATE TABLE public.article_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  summary text,
  status_at_that_time text NOT NULL,
  edited_by uuid NOT NULL,
  change_note text,
  snapshot_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_versions_pkey PRIMARY KEY (id),
  CONSTRAINT article_versions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id),
  CONSTRAINT article_versions_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.knowledge_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'reviewed'::text, 'published'::text])),
  creator_id uuid NOT NULL,
  source_document_id uuid,
  current_version_number integer NOT NULL DEFAULT 1,
  duplicate_flag boolean NOT NULL DEFAULT false,
  conflict_flag boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_articles_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_articles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id),
  CONSTRAINT knowledge_articles_source_document_id_fkey FOREIGN KEY (source_document_id) REFERENCES public.source_documents(id)
);
CREATE TABLE public.processing_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_document_id uuid,
  document_storage_path text,
  stage text NOT NULL,
  message text,
  level text NOT NULL DEFAULT 'info'::text CHECK (level = ANY (ARRAY['info'::text, 'warn'::text, 'error'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT processing_logs_pkey PRIMARY KEY (id),
  CONSTRAINT processing_logs_source_document_id_fkey FOREIGN KEY (source_document_id) REFERENCES public.source_documents(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'editor'::text CHECK (role = ANY (ARRAY['editor'::text, 'reviewer'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.source_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_name text NOT NULL,
  file_type text NOT NULL CHECK (
  file_type = ANY (
    ARRAY[
      'text'::text,
      'pdf'::text,
      'docx'::text,
      'image'::text
    ]
  )
),
  storage_path text,
  extracted_text text,
  normalized_text text,
  content_hash text,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT source_documents_pkey PRIMARY KEY (id),
  CONSTRAINT source_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  note text,
  CONSTRAINT status_history_pkey PRIMARY KEY (id),
  CONSTRAINT status_history_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id),
  CONSTRAINT status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);