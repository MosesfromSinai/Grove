begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values
 ('56000000-0000-4000-8000-000000000001','push-one@ucr.edu'),
 ('56000000-0000-4000-8000-000000000002','push-two@ucr.edu'),
 ('56000000-0000-4000-8000-000000000003','push-no@example.test');
set local role anon;
select throws_ok($$select * from public.push_subscriptions$$,'42501',null,'anonymous cannot read endpoints or saved locations');
select throws_ok($$select * from public.push_deliveries$$,'42501',null,'anonymous cannot read deliveries');
select throws_ok($$select * from public.claim_push_deliveries()$$,'42501',null,'anonymous cannot dispatch');
reset role;
set local role authenticated;
select is(public.save_push_subscription('https://fcm.googleapis.com/test','{}',0,0)->>'error','NOT_SIGNED_IN','no JWT cannot register');
set local request.jwt.claims='{"sub":"56000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is(public.save_push_subscription('https://fcm.googleapis.com/test','{}',0,0)->>'error','NOT_VERIFIED_STUDENT','non-campus account cannot opt in');
set local request.jwt.claims='{"sub":"56000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select * from public.push_subscriptions$$,'42501',null,'student cannot read endpoint table');
select throws_ok($$insert into public.push_subscriptions default values$$,'42501',null,'student cannot bypass RPC validation');
select throws_ok($$select * from public.claim_push_deliveries()$$,'42501',null,'student cannot dispatch');
select throws_ok($$select push_delivery_eligible(null,null)$$,'42501',null,'student cannot enumerate eligibility');
select is(public.save_push_subscription('https://fcm.googleapis.com/test','{}','NaN'::float8,0)->>'error','INVALID_LOCATION','NaN rejected');
select is(public.save_push_subscription('https://fcm.googleapis.com/test','{}',0,'Infinity'::float8)->>'error','INVALID_LOCATION','infinity rejected');
select is(public.save_push_subscription('https://127.0.0.1/private',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),0,0)->>'error','INVALID_SUBSCRIPTION','private URL rejected');
select is(public.save_push_subscription('https://fcm.googleapis.com:443/test',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),0,0)->>'error','INVALID_SUBSCRIPTION','explicit port rejected by strict endpoint pattern');
select is(public.save_push_subscription('https://fcm.googleapis.com/test#bad',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),0,0)->>'error','INVALID_SUBSCRIPTION','fragment rejected');
select is(public.save_push_subscription('https://fcm.googleapis.com/test','{}',0,0)->>'error','INVALID_SUBSCRIPTION','missing keys rejected');
select is(public.save_push_subscription('https://fcm.googleapis.com/offline-one',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),33.973732,-117.328174)->>'ok','true','verified student can register');
select is(public.get_push_subscription('https://fcm.googleapis.com/offline-one')->>'active','true','owner sees safe active state');
select ok(not(public.get_push_subscription('https://fcm.googleapis.com/offline-one')?'keys'),'state does not expose keys');
reset role;
select is((select round(st_y(location::geometry)::numeric,3) from push_subscriptions where endpoint='https://fcm.googleapis.com/offline-one'),33.974::numeric,'saved latitude rounded');
select is((select expires_at from push_subscriptions where endpoint='https://fcm.googleapis.com/offline-one'),now()+interval '7 days','saved area expires in seven days');
set local role authenticated;
set local request.jwt.claims='{"sub":"56000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(public.get_push_subscription('https://fcm.googleapis.com/offline-one')->>'active','false','another account cannot read preference');
select is(public.save_push_subscription('https://fcm.googleapis.com/offline-one',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),33.974,-117.328)->>'error','SUBSCRIPTION_IN_USE','another account cannot take over endpoint');
select is(public.remove_push_subscription('https://fcm.googleapis.com/offline-one')->>'ok','true','remove is idempotent without ownership disclosure');
select is(public.save_push_subscription('https://web.push.apple.com/offline-far',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),34.5,-117.3)->>'ok','true','far location accepted but not eligible for near deals');
reset role;
select is((select count(*) from push_subscriptions where endpoint='https://fcm.googleapis.com/offline-one'),1::bigint,'foreign remove preserved real owner');
set local role authenticated;
set local request.jwt.claims='{"sub":"56000000-0000-4000-8000-000000000001","role":"authenticated"}';
select save_push_subscription('https://fcm.googleapis.com/offline-device-'||i,jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),33.974,-117.328) from generate_series(2,5) i;
select is(save_push_subscription('https://fcm.googleapis.com/offline-device-6',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),33.974,-117.328)->>'error','DEVICE_LIMIT','max five devices');
select is(save_push_subscription('https://fcm.googleapis.com/offline-one',jsonb_build_object('p256dh','B'||repeat('a',86),'auth',repeat('a',22)),33.974,-117.328)->>'ok','true','renew existing device at limit');
reset role;
delete from push_subscriptions where endpoint like '%offline-device-%';
update deals set active_days=null,daily_start=null,daily_end=null,starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour';
update businesses set location=st_setsrid(st_makepoint(-117.328,33.974),4326)::geography where id='b0000000-0000-4000-8000-000000000001';
update businesses set location=st_setsrid(st_makepoint(-120,40),4326)::geography where id='b0000000-0000-4000-8000-000000000003';
insert into deals(id,business_id,title,starts_at,ends_at,visibility) values
 ('de560000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','public-one',now()-interval '1 hour',now()+interval '1 hour','public'),
 ('de560000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','public-two',now()-interval '1 hour',now()+interval '1 hour','public'),
 ('de560000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001','hidden-club',now()-interval '1 hour',now()+interval '1 hour','link_only'),
 ('de560000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000003','far-public',now()-interval '1 hour',now()+interval '1 hour','public');
set local role service_role;
select ok(push_delivery_eligible((select id from push_subscriptions where endpoint='https://fcm.googleapis.com/offline-one'),'de560000-0000-4000-8000-000000000001'),'fresh public nearby consent is eligible');
select ok(not push_delivery_eligible((select id from push_subscriptions where endpoint='https://fcm.googleapis.com/offline-one'),'de560000-0000-4000-8000-000000000003'),'hidden deals rejected at final send gate');
select is((select count(*) from claim_push_deliveries()),2::bigint,'only nearby public deals claimed, far recipient/business and hidden deals excluded');
select is((select count(*) from claim_push_deliveries()),0::bigint,'repeated dispatch has no duplicate claims');
reset role;
select is((select count(*) from push_deliveries where deal_id='de560000-0000-4000-8000-000000000003'),0::bigint,'hidden deal never queued');
insert into deals(id,business_id,title,starts_at,ends_at) values
 ('de560000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000001','public-three',now()-interval '1 hour',now()+interval '1 hour'),
 ('de560000-0000-4000-8000-000000000006','b0000000-0000-4000-8000-000000000001','public-four',now()-interval '1 hour',now()+interval '1 hour');
set local role service_role;
select is((select count(*) from claim_push_deliveries()),1::bigint,'rolling cap allows one remaining attempt, not both new deals');
select is((select count(*) from claim_push_deliveries()),0::bigint,'cap persists across requests');
select throws_ok($$select * from claim_push_deliveries(null,101)$$,'P0001','Invalid batch size','oversized batch rejected');
select throws_ok($$select * from claim_push_deliveries(null,null)$$,'P0001','Invalid batch size','null cannot make unbounded batch');
reset role;
delete from push_deliveries;
update deals set ends_at=now()-interval '1 minute' where id::text like 'de560000%';
insert into deals(id,business_id,title,starts_at,active_days,daily_start,daily_end)
 values('de560000-0000-4000-8000-000000000007','b0000000-0000-4000-8000-000000000001','repeating-public',now()-interval '2 days',
 array[lower(to_char(now() at time zone 'America/Los_Angeles','Dy'))],'00:00','23:59:59');
set local role service_role;
select is((select count(*) from claim_push_deliveries()),1::bigint,'active repeating window is claimed');
select is((select count(*) from claim_push_deliveries()),0::bigint,'same repeat window deduplicated');
reset role;
select is((select window_start from push_deliveries),((now() at time zone 'America/Los_Angeles')::date::timestamp at time zone 'America/Los_Angeles'),'repeat window uses campus timezone midnight');
delete from push_deliveries;
update profiles set verified_student=false where id='56000000-0000-4000-8000-000000000001';
set local role service_role;
select is((select count(*) from claim_push_deliveries()),0::bigint,'revoked student status blocks existing subscription');
select ok(not push_delivery_eligible((select id from push_subscriptions where endpoint='https://fcm.googleapis.com/offline-one'),'de560000-0000-4000-8000-000000000007'),'revocation between claim and send is blocked by final gate');
reset role;
update profiles set verified_student=true where id='56000000-0000-4000-8000-000000000001';
update push_subscriptions set expires_at=now()-interval '1 second';
set local role service_role;
select is((select count(*) from claim_push_deliveries()),0::bigint,'expired saved areas never receive alerts');
reset role;
select is((select count(*) from push_subscriptions),0::bigint,'expired areas removed by dispatcher');
select * from finish();
rollback;
