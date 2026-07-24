import { AdminShell } from "@/components/admin/AdminShell";
import { FaqAdmin } from "@/components/admin/FaqAdmin";
import { DEFAULT_FAQS } from "@/lib/defaults";
import { tryCreateClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { Faq } from "@/lib/types";

export default async function AdminFaqPage() {
  let faqs: Faq[] = DEFAULT_FAQS;
  if (isSupabaseConfigured()) {
    const supabase = await tryCreateClient();
    if (supabase) {
      const { data } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });
      if (data) faqs = data as Faq[];
    }
  }

  return (
    <AdminShell title="자주 묻는 질문" description="FAQ를 추가·수정·삭제합니다.">
      <FaqAdmin initialFaqs={faqs} />
    </AdminShell>
  );
}
