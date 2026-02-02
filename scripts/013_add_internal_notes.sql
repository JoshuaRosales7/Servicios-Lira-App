-- Add is_internal column to ticket_messages
alter table ticket_messages add column if not exists is_internal boolean default false;

-- Add index for performance check
create index if not exists idx_ticket_messages_internal on ticket_messages(is_internal);
