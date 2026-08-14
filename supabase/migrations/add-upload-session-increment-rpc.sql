-- Atomic upload session counter (prevents race bypass of per-session limits)
create or replace function public.increment_upload_session_count(
  p_session_id text,
  p_max_count integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.upload_sessions
  set upload_count = upload_count + 1
  where id = p_session_id
    and upload_count < p_max_count
    and expires_at > now()
  returning upload_count into updated_count;

  return found;
end;
$$;

revoke all on function public.increment_upload_session_count from public;
grant execute on function public.increment_upload_session_count to service_role;
