-- Add full-quality original file path for uploaded images (existing projects)
alter table public.uploaded_files
  add column if not exists original_stored_name text;
