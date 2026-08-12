-- TaskFlow Database Schema
-- Run this in Supabase SQL Editor

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- Boards
create table if not exists public.boards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Columns
create table if not exists public.columns (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  position int not null default 0,
  created_at timestamptz default now() not null
);

-- Tasks with customization fields
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references public.columns(id) on delete cascade not null,
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  description text,
  position int not null default 0,
  bg_color text default '#ffffff',
  border_color text default '#e5e7eb',
  border_style text default 'solid',
  badges jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Board members for shared access
create table if not exists public.board_members (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null,
  created_at timestamptz default now() not null,
  unique(board_id, user_id)
);

-- Indexes
create index if not exists idx_columns_board_id on public.columns(board_id);
create index if not exists idx_tasks_column_id on public.tasks(column_id);
create index if not exists idx_tasks_board_id on public.tasks(board_id);
create index if not exists idx_board_members_board_id on public.board_members(board_id);
create index if not exists idx_board_members_user_id on public.board_members(user_id);
create index if not exists idx_profiles_username on public.profiles(username);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for boards and tasks
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists boards_updated_at on public.boards;
create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.update_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.board_members enable row level security;

-- Profiles: anyone can read, users can update own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Helper: check board access
create or replace function public.has_board_access(board_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.boards b
    where b.id = board_uuid and b.owner_id = auth.uid()
  ) or exists (
    select 1 from public.board_members bm
    where bm.board_id = board_uuid and bm.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Boards
create policy "Users can view accessible boards"
  on public.boards for select
  using (owner_id = auth.uid() or public.has_board_access(id));

create policy "Users can create boards"
  on public.boards for insert
  with check (owner_id = auth.uid());

create policy "Owners can update boards"
  on public.boards for update
  using (owner_id = auth.uid());

create policy "Owners can delete boards"
  on public.boards for delete
  using (owner_id = auth.uid());

-- Columns
create policy "Users can view columns of accessible boards"
  on public.columns for select
  using (public.has_board_access(board_id));

create policy "Users can manage columns on accessible boards"
  on public.columns for all
  using (public.has_board_access(board_id));

-- Tasks
create policy "Users can view tasks of accessible boards"
  on public.tasks for select
  using (public.has_board_access(board_id));

create policy "Users can manage tasks on accessible boards"
  on public.tasks for all
  using (public.has_board_access(board_id));

-- Board members
create policy "Members can view board members"
  on public.board_members for select
  using (public.has_board_access(board_id));

create policy "Owners can manage board members"
  on public.board_members for all
  using (
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.owner_id = auth.uid()
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.columns;
alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.board_members;
