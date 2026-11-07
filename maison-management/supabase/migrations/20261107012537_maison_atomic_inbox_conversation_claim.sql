create or replace function public.claim_inbox_conversation(p_conversation_id uuid)
returns table(id uuid, assigned_to uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  v_role := private.current_app_role();
  if v_role <> 'chatter' then
    raise exception 'Only chatters can claim conversations';
  end if;

  return query
  update public.inbox_conversations c
     set assigned_to = auth.uid(), updated_at = now()
   where c.id = p_conversation_id
     and private.can_access_model(c.model_id)
     and (c.assigned_to is null or c.assigned_to = auth.uid())
  returning c.id, c.assigned_to;

  if not found then
    raise exception 'Conversation is already assigned or inaccessible';
  end if;
end;
$$;

revoke all on function public.claim_inbox_conversation(uuid) from public, anon;
grant execute on function public.claim_inbox_conversation(uuid) to authenticated;
