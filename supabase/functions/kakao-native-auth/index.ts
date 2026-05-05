import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { kakao_access_token } = await req.json()

    if (!kakao_access_token) {
      return new Response(
        JSON.stringify({ error: 'kakao_access_token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. 카카오 access token으로 유저 정보 조회
    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakao_access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    })

    if (!kakaoRes.ok) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 카카오 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const kakaoUser = await kakaoRes.json()
    const kakaoId = String(kakaoUser.id)
    const email = kakaoUser.kakao_account?.email
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? ''

    if (!email) {
      return new Response(
        JSON.stringify({ error: '카카오 계정에 이메일 정보가 없습니다. 카카오 동의항목에서 이메일을 허용해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Supabase admin 클라이언트
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // 3. magic link 생성 (유저 없으면 자동 생성)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        data: { kakao_id: kakaoId, full_name: nickname },
      },
    })

    if (linkError || !linkData?.properties) {
      throw new Error(`링크 생성 실패: ${linkError?.message}`)
    }

    // 4. 유저 메타데이터에 kakao_id 저장
    if (linkData.user?.id) {
      const meta = linkData.user.user_metadata ?? {}
      if (!meta.kakao_id) {
        await supabase.auth.admin.updateUserById(linkData.user.id, {
          user_metadata: { ...meta, kakao_id: kakaoId, full_name: nickname },
        })
      }
    }

    // 5. magic link 토큰으로 세션 발급
    const hashedToken = linkData.properties.hashed_token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    const verifyRes = await fetch(
      `${supabaseUrl}/auth/v1/verify?token=${hashedToken}&type=magiclink&redirect_to=https://placeholder.poff.app`,
      {
        redirect: 'manual',
        headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY')! },
      }
    )

    const location = verifyRes.headers.get('location') ?? ''
    const fragment = location.includes('#') ? location.split('#')[1] : ''
    const params = new URLSearchParams(fragment)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      throw new Error('세션 토큰 추출 실패')
    }

    return new Response(
      JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? '서버 오류' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
