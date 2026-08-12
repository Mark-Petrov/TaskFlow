-- Board types, task completion, actor tracking

-- Board type enum
do $$ begin
  create type public.board_type as enum ('kanban', 'list');
exception
  when duplicate_object then null;
end $$;

alter table public.boards
  add column if not exists type public.board_type not null default 'kanban';

alter table public.tasks
  add column if not exists is_completed boolean not null default false;

alter table public.tasks
  add column if not exists completed_at timestamptz;

alter table public.tasks
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.tasks
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_tasks_is_completed on public.tasks(board_id, is_completed);
create index if not exists idx_tasks_completed_at on public.tasks(completed_at);

-- Allow all board members to update board (type switch)
drop policy if exists "Owners can update boards" on public.boards;
create policy "Members can update boards"
  on public.boards for update
  using (public.has_board_access(id));

-- Notifications inbox
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  board_id uuid references public.boards(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('task_created', 'task_completed', 'task_updated')),
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now() not null
);

create index if not exists idx_notifications_user_id on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "Board members can insert notifications for others"
  on public.notifications for insert
  with check (
    actor_id = auth.uid()
    and user_id <> auth.uid()
    and public.has_board_access(board_id)
  );

alter publication supabase_realtime add table public.notifications;

-- Notify board members when task is created or completed by someone else
create or replace function public.notify_task_change()
returns trigger as $$
declare
  member record;
  actor uuid := auth.uid();
  board_title text;
  actor_name text;
  msg text;
  evt text;
begin
  if actor is null then return coalesce(new, old); end if;

  select title into board_title from public.boards where id = coalesce(new.board_id, old.board_id);

  select coalesce(display_name, username, 'Участник') into actor_name
  from public.profiles where id = actor;

  if tg_op = 'INSERT' then
    evt := 'task_created';
    msg := actor_name || ' добавил задачу «' || new.title || '» в «' || board_title || '»';
    for member in
      select distinct uid as user_id from (
        select bm.user_id as uid from public.board_members bm
        where bm.board_id = new.board_id
        union
        select b.owner_id as uid from public.boards b
        where b.id = new.board_id
      ) all_members
      where uid <> actor
    loop
      insert into public.notifications (user_id, board_id, task_id, actor_id, type, message)
      values (member.user_id, new.board_id, new.id, actor, evt, msg);
    end loop;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_completed is distinct from new.is_completed then
      if new.is_completed then
        evt := 'task_completed';
        msg := actor_name || ' выполнил «' || new.title || '»';
      else
        evt := 'task_updated';
        msg := actor_name || ' вернул задачу «' || new.title || '»';
      end if;
    elsif old.title is distinct from new.title then
      evt := 'task_updated';
      msg := actor_name || ' изменил задачу на «' || new.title || '»';
    else
      return new;
    end if;

    for member in
      select distinct uid as user_id from (
        select bm.user_id as uid from public.board_members bm
        where bm.board_id = new.board_id
        union
        select b.owner_id as uid from public.boards b
        where b.id = new.board_id
      ) all_members
      where uid <> actor
    loop
      insert into public.notifications (user_id, board_id, task_id, actor_id, type, message)
      values (member.user_id, new.board_id, new.id, actor, evt, msg);
    end loop;
    return new;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_notify on public.tasks;
create trigger on_task_notify
  after insert or update on public.tasks
  for each row execute function public.notify_task_change();
