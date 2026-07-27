import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * 관리자 판별 — public.admin_users(email allowlist) 기준.
 * JWT app_metadata.role 은 사용하지 않음.
 *
 * DB의 public.is_site_admin() 과 동일한 판별이 되도록 RPC를 우선 호출하고,
 * RPC가 없으면 admin_users 직접 조회로 폴백한다.
 */
export async function checkIsAdmin(
  supabase: SupabaseClient,
  user: User | null | undefined,
): Promise<boolean> {
  if (!user?.email) return false;

  const { data: rpcResult, error: rpcError } = await supabase.rpc("is_site_admin");
  if (!rpcError && typeof rpcResult === "boolean") {
    return rpcResult;
  }

  const email = user.email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.id);
}
