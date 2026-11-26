-- Mis Estudios: separate workspace, no changes to public.progreso or auth.users.
begin;
create table if not exists public.study_workspace (
  user_id uuid primary key references auth.users(id) on delete cascade,
  datos jsonb not null check (jsonb_typeof(datos) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.study_workspace enable row level security;
revoke all on public.study_workspace from anon;
grant select, insert, update, delete on public.study_workspace to authenticated;
drop policy if exists "study_select_own" on public.study_workspace;
create policy "study_select_own" on public.study_workspace for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "study_insert_own" on public.study_workspace;
create policy "study_insert_own" on public.study_workspace for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "study_update_own" on public.study_workspace;
create policy "study_update_own" on public.study_workspace for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "study_delete_own" on public.study_workspace;
create policy "study_delete_own" on public.study_workspace for delete to authenticated using ((select auth.uid()) = user_id);
commit;
