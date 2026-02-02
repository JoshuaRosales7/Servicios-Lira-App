-- Create tickets table
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');

create table if not exists tickets (
    id uuid default gen_random_uuid() primary key,
    -- Changed reference from auth.users to public.profiles to allow joins
    client_id uuid references public.profiles(id) on delete cascade not null,
    subject text not null,
    status ticket_status default 'open',
    priority ticket_priority default 'normal',
    last_message_at timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create ticket messages table
create table if not exists ticket_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references tickets(id) on delete cascade not null,
     -- Changed reference from auth.users to public.profiles to allow joins
    user_id uuid references public.profiles(id) on delete cascade not null,
    message text not null,
    attachments jsonb default '[]'::jsonb, -- Array of {name, url, type, size}
    read boolean default false,
    created_at timestamptz default now()
);

-- Enable RLS
alter table tickets enable row level security;
alter table ticket_messages enable row level security;

-- Policies for Tickets

-- Clients can view their own tickets
create policy "Clients can view their own tickets"
on tickets for select
using (auth.uid() = client_id);

-- Admins can view all tickets
create policy "Admins can view all tickets"
on tickets for select
using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);

-- Clients can create tickets
create policy "Clients can create tickets"
on tickets for insert
with check (auth.uid() = client_id);

-- Admins can update tickets (status, priority)
create policy "Admins can update tickets"
on tickets for update
using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);

-- Clients can update their own tickets (e.g. to close them, though usually just admins close or system closes)
-- Letting clients update `last_message_at` implicitly via application logic if needed, but usually triggered by message insert.
-- For now, let's allow clients to update if they own it (maybe to close it).
create policy "Clients can update own tickets"
on tickets for update
using (auth.uid() = client_id);


-- Policies for Ticket Messages

-- Participants can view messages (Client or Admin)
create policy "Participants can view messages"
on ticket_messages for select
using (
    exists (
        select 1 from tickets
        where tickets.id = ticket_messages.ticket_id
        and (
            tickets.client_id = auth.uid()
            or exists (
                select 1 from profiles
                where profiles.id = auth.uid()
                and profiles.role = 'admin'
            )
        )
    )
);

-- Participants can insert messages
create policy "Participants can insert messages"
on ticket_messages for insert
with check (
    exists (
        select 1 from tickets
        where tickets.id = ticket_messages.ticket_id
        and (
            tickets.client_id = auth.uid()
            or exists (
                select 1 from profiles
                where profiles.id = auth.uid()
                and profiles.role = 'admin'
            )
        )
    )
);

-- Realtime subscription
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table ticket_messages;
