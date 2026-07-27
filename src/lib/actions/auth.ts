"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkIsAdmin } from "@/lib/auth/is-admin";
import { createClient, tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase 환경 변수가 설정되지 않았습니다." };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요." };
  }

  // 로그인 방식(이메일/비밀번호)은 동일. 관리자 여부는 admin_users allowlist로 확인.
  if (!(await checkIsAdmin(supabase, data.user))) {
    await supabase.auth.signOut();
    return {
      error:
        "관리자 권한이 없습니다. public.admin_users 테이블에 이메일을 등록한 뒤 다시 로그인해 주세요.",
    };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  const supabase = await tryCreateClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
