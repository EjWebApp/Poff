// Poff - 태스크 완료 푸시 알림 발송 Edge Function
// 트리거: pg_cron으로 매 1분 호출
//
// pg_cron 등록 SQL (Supabase SQL Editor에서 실행):
//   select cron.schedule(
//     'send-push-notifications',
//     '* * * * *',
//     $$
//       select net.http_post(
//         url := 'https://<your-project-ref>.supabase.co/functions/v1/send-push-notifications',
//         headers := '{"Authorization": "Bearer <your-service-role-key>"}'::jsonb
//       )
//     $$
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date().toISOString();

  // 발송 대기 중인 알림 + 해당 유저의 push token 조회
  const { data: notifications, error } = await supabase
    .from('task_push_notifications')
    .select('id, user_id, title, body, push_tokens!inner(token)')
    .eq('sent', false)
    .lte('scheduled_at', now);

  if (error) {
    console.error('fetch error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!notifications?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Expo Push API 일괄 발송
  const messages = notifications.map((n: any) => ({
    to: n.push_tokens.token,
    title: n.title,
    body: n.body,
    sound: 'default',
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error('Expo Push error:', await res.text());
    }
  } catch (e) {
    console.error('Expo Push exception:', e);
  }

  // 발송 완료 처리
  const ids = notifications.map((n: any) => n.id);
  await supabase
    .from('task_push_notifications')
    .update({ sent: true })
    .in('id', ids);

  return new Response(JSON.stringify({ sent: ids.length }), { status: 200 });
});
