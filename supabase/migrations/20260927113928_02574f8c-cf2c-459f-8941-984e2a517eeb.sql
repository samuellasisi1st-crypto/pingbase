
INSERT INTO public.workspaces (id, name, slug, timezone)
VALUES ('11111111-1111-1111-1111-111111111111', 'Studio Nine Hair', 'studio-nine-hair', 'Europe/London');

INSERT INTO public.business_settings (workspace_id, legal_name, address, phone, email, opening_hours, buffer_minutes, min_notice_minutes, max_days_ahead)
VALUES ('11111111-1111-1111-1111-111111111111', 'Studio Nine Hair Ltd', '9 Redchurch Street, Shoreditch, London E2 7DJ', '+44 20 7946 0199', 'hello@studioninehair.co.uk',
 '{"0":null,"1":["09:00","17:00"],"2":["09:00","18:00"],"3":["09:00","19:00"],"4":["09:00","19:00"],"5":["09:00","19:00"],"6":["10:00","18:00"]}'::jsonb,
 15, 120, 90);

INSERT INTO public.services (id, workspace_id, name, description, price_pence, duration_minutes, deposit_pence) VALUES
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Knotless Braids','Protective knotless braiding, mid-back length included.',12000,240,3000),
 ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Silk Press','Wash, blow dry and silk press finish.',6500,90,1500),
 ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Colour Consultation','In-person colour planning and strand test.',3000,45,0),
 ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Full Colour','Full head colour including toner and finish.',16000,180,4000),
 ('22222222-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Wash + Style','Wash, condition and style.',5000,60,1000);

INSERT INTO public.staff (id, workspace_id, name, role_title) VALUES
 ('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Maya','Senior Stylist'),
 ('33333333-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Amara','Braiding Specialist'),
 ('33333333-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Leah','Colour Specialist');

INSERT INTO public.staff_services (workspace_id, staff_id, service_id) VALUES
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000001'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000003'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000005'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000005');

INSERT INTO public.staff_working_hours (workspace_id, staff_id, weekday, start_time, end_time)
SELECT '11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000001', d, '10:00','18:00' FROM generate_series(2,6) d;
INSERT INTO public.staff_working_hours (workspace_id, staff_id, weekday, start_time, end_time)
SELECT '11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000002', d, '11:00','19:00' FROM generate_series(3,6) d;
INSERT INTO public.staff_working_hours (workspace_id, staff_id, weekday, start_time, end_time)
VALUES ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000002', 0, '11:00','19:00');
INSERT INTO public.staff_working_hours (workspace_id, staff_id, weekday, start_time, end_time)
SELECT '11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000003', d, '09:00','17:00' FROM generate_series(1,5) d;

INSERT INTO public.business_policies (workspace_id, kind, title, body) VALUES
 ('11111111-1111-1111-1111-111111111111','cancellation','Cancellation','Free cancellation up to 48 hours before your appointment. Inside 48 hours the deposit is non-refundable. Exceptions are reviewed by the salon team.'),
 ('11111111-1111-1111-1111-111111111111','reschedule','Rescheduling','You may reschedule once free of charge with at least 24 hours notice. Your deposit moves with the booking.'),
 ('11111111-1111-1111-1111-111111111111','lateness','Lateness','We hold your slot for 15 minutes. After that the service may be shortened or rebooked, and the deposit may be lost.'),
 ('11111111-1111-1111-1111-111111111111','deposit','Deposits','Deposits secure your slot and are deducted from the final price. Braiding and colour services always require a deposit.'),
 ('11111111-1111-1111-1111-111111111111','refund','Refunds','Deposits are refundable only when cancelling more than 48 hours ahead, or where the salon cancels. All other refunds need a team decision.'),
 ('11111111-1111-1111-1111-111111111111','hours','Opening hours','Mon 09:00-17:00, Tue 09:00-18:00, Wed-Fri 09:00-19:00, Sat 10:00-18:00, Sun by braiding appointment only.'),
 ('11111111-1111-1111-1111-111111111111','preparation','Preparation','Come with hair washed and fully detangled for braiding. For silk press and colour, arrive with dry, product-free hair.');

INSERT INTO public.knowledge_sources (workspace_id, kind, title, body, tags) VALUES
 ('11111111-1111-1111-1111-111111111111','business','Address and finding us','Studio Nine Hair is at 9 Redchurch Street, Shoreditch, London E2 7DJ. Nearest stations are Shoreditch High Street (5 min) and Liverpool Street (12 min).', ARRAY['address','location']),
 ('11111111-1111-1111-1111-111111111111','faq','Parking','There is no salon car park. Paid on-street parking is available on Redchurch Street and Ebor Street, free after 18:30 and on Sundays.', ARRAY['parking']),
 ('11111111-1111-1111-1111-111111111111','faq','Hair preparation before braiding','Please arrive with hair freshly washed, blow dried and detangled. If you need us to wash and prep, add Wash + Style when booking.', ARRAY['preparation','braids']),
 ('11111111-1111-1111-1111-111111111111','faq','Late arrival','We hold appointments for 15 minutes. Later than that and we may need to shorten or rebook the service.', ARRAY['lateness']),
 ('11111111-1111-1111-1111-111111111111','policy','Cancellation window','Cancel more than 48 hours ahead for a full deposit refund. Inside 48 hours the deposit is non-refundable.', ARRAY['cancellation','refund']),
 ('11111111-1111-1111-1111-111111111111','policy','Deposits explained','Deposits range from £10 to £40 depending on the service and always come off the final bill.', ARRAY['deposit','payment']),
 ('11111111-1111-1111-1111-111111111111','faq','Children','Children are welcome for their own appointments from age 8. We cannot supervise children while you are in the chair.', ARRAY['children']),
 ('11111111-1111-1111-1111-111111111111','faq','Opening hours','Mon 09:00-17:00, Tue 09:00-18:00, Wed-Fri 09:00-19:00, Sat 10:00-18:00, Sun braiding appointments only with Amara.', ARRAY['hours']);

INSERT INTO public.ai_agent_settings (workspace_id, agent_name, tone, instructions, autonomy_level, escalation_rules, forbidden_topics)
VALUES ('11111111-1111-1111-1111-111111111111','Nia','Warm, concise, professional',
 'Be warm, concise and helpful. Never invent information. Never promise appointment availability before checking the booking system. Ask only necessary questions. Do not pressure customers into making a booking. Escalate whenever human judgement is needed.',
 'BOOK_WITH_GUARDRAILS',
 'Escalate on refund requests, complaints, policy exceptions, explicit requests for a person, or repeated tool failures.',
 'Medical advice, legal advice, discounts not listed in services.');

INSERT INTO public.channel_connections (workspace_id, channel, status, display_name) VALUES
 ('11111111-1111-1111-1111-111111111111','test','CONNECTED','Internal test channel'),
 ('11111111-1111-1111-1111-111111111111','instagram','NOT_CONNECTED','Instagram Direct'),
 ('11111111-1111-1111-1111-111111111111','messenger','NOT_CONNECTED','Facebook Messenger'),
 ('11111111-1111-1111-1111-111111111111','whatsapp','NOT_CONNECTED','WhatsApp Cloud API'),
 ('11111111-1111-1111-1111-111111111111','telegram','NOT_CONNECTED','Telegram Bot'),
 ('11111111-1111-1111-1111-111111111111','gmail','NOT_CONNECTED','Gmail'),
 ('11111111-1111-1111-1111-111111111111','outlook','NOT_CONNECTED','Outlook');
