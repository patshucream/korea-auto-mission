import { checkIsAdmin } from "@/lib/auth/is-admin";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

/**
 * Server Component 렌더에서 호출하는 인증 확인용 헬퍼.
 * `"use server"` 파일에 두면 Server Action이 되어 렌더 중 호출 시 오류가 난다.
 *
 * 관리자 = public.admin_users 에 이메일이 등록된 로그인 사용자
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    return { user: null, configured: false as const, supabase: null };
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return { user: null, configured: false as const, supabase: null };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !(await checkIsAdmin(supabase, user))) {
    return { user: null, configured: true as const, supabase };
  }

  return { user, configured: true as const, supabase };
}
