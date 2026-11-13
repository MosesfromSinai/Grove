-- Moses applies separately AFTER reviewing the migration, function and Vault secrets.
-- Requires pg_cron + pg_net enabled in Supabase. No secrets are embedded in this file.
-- Vault names: grove_push_function_url, grove_push_dispatch_secret.
do $$
declare existing bigint;
begin
  if not exists(select 1 from vault.decrypted_secrets where name='grove_push_function_url')
     or not exists(select 1 from vault.decrypted_secrets where name='grove_push_dispatch_secret') then
    raise exception 'Configure the two Grove push Vault secrets first';
  end if;
  for existing in select jobid from cron.job where jobname='grove-push-live-deals' loop
    perform cron.unschedule(existing);
  end loop;
  perform cron.schedule('grove-push-live-deals','* * * * *',$job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name='grove_push_function_url'),
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name='grove_push_dispatch_secret')),
      body := '{}'::jsonb, timeout_milliseconds := 50000
    );
  $job$);
end $$;
