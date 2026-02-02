-- Fix ticket relationship to allow joins with public.profiles
-- Run this if you already ran the previous script and are getting "foreign key relationship not found" errors

-- 1. Drop existing FK constraints
alter table tickets drop constraint if exists tickets_client_id_fkey;
alter table ticket_messages drop constraint if exists ticket_messages_user_id_fkey;

-- 2. Add new FK constraints referencing public.profiles
alter table tickets 
    add constraint tickets_client_id_fkey 
    foreign key (client_id) 
    references public.profiles(id) 
    on delete cascade;

alter table ticket_messages 
    add constraint ticket_messages_user_id_fkey 
    foreign key (user_id) 
    references public.profiles(id) 
    on delete cascade;

-- 3. Reload schema cache (usually automatic, but good to know)
notify pgrst, 'reload config';
