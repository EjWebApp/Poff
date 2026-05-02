// Poff - 루틴 완료 이메일 발송 Edge Function
// 트리거: pg_cron으로 매 5분 호출 (아래 SQL 참고)
//
// Supabase 대시보드 > Settings > Edge Functions > Secrets 에 추가 필요:
//   RESEND_API_KEY = re_xxxxxxxx  (https://resend.com 에서 발급, 무료 3000건/월)
//
// pg_cron 등록 SQL (Supabase SQL Editor에서 실행):
//   select cron.schedule(
//     'send-routine-emails',
//     '*/5 * * * *',
//     $$
//       select net.http_post(
//         url := 'https://<your-project-ref>.supabase.co/functions/v1/send-routine-emails',
//         headers := '{"Authorization": "Bearer <your-service-role-key>"}'::jsonb
//       )
//     $$
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date().toISOString();

  const { data: notifications, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('sent', false)
    .lte('scheduled_at', now);

  if (error) {
    console.error('fetch notifications error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let sentCount = 0;
  for (const notif of notifications) {
    const ok = await sendEmail(notif.email, notif.routine_name);
    if (ok) {
      await supabase
        .from('scheduled_notifications')
        .update({ sent: true })
        .eq('id', notif.id);
      sentCount++;
    }
  }

  return new Response(JSON.stringify({ sent: sentCount }), { status: 200 });
});

async function sendEmail(to: string, routineName: string): Promise<boolean> {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY 미설정 - 이메일 발송 건너뜀');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Poff <noreply@yourdomain.com>', // Resend에서 인증한 도메인으로 변경
        to: [to],
        subject: `✅ "${routineName}" 루틴 완료!`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #d97706;">🎉 루틴 완료!</h2>
            <p style="font-size: 16px; color: #374151;">
              <strong>${routineName}</strong> 루틴을 모두 마쳤어요.<br/>
              오늘도 수고했어요!
            </p>
            <p style="font-size: 13px; color: #9ca3af; margin-top: 32px;">
              Poff · 루틴 타이머 앱
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend error:', res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error('sendEmail exception:', e);
    return false;
  }
}
