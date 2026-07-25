"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicReviewSchema } from "@/lib/schemas";
import { stripHtml } from "@/lib/reviews";
import { isSupabaseConfigured } from "@/lib/utils";

export type SubmitReviewResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const RATE_COOKIE = "kam_review_submitted_at";
const RATE_MS = 60_000;

function logSupabaseError(
  context: string,
  error: { message?: string; details?: string | null; hint?: string | null; code?: string | null },
) {
  console.error(`[Supabase:${context}]`, {
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
  });
}

export async function submitPublicReview(input: {
  author_name: string;
  vehicle_name?: string;
  rating: number;
  content: string;
  website?: string;
}): Promise<SubmitReviewResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "지금은 후기를 접수할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }

  // 허니팟
  if (input.website && input.website.trim()) {
    return {
      ok: true,
      message: "후기가 등록되었습니다. 관리자 확인 후 홈페이지에 공개됩니다.",
    };
  }

  const cookieStore = await cookies();
  const last = cookieStore.get(RATE_COOKIE)?.value;
  if (last) {
    const elapsed = Date.now() - Number(last);
    if (Number.isFinite(elapsed) && elapsed < RATE_MS) {
      return {
        ok: false,
        error: "잠시 후 다시 작성할 수 있습니다. 연속 제출은 제한됩니다.",
      };
    }
  }

  const parsed = publicReviewSchema.safeParse({
    ...input,
    website: input.website ?? "",
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "입력값을 확인해 주세요.";
    return { ok: false, error: msg };
  }

  const author_name = stripHtml(parsed.data.author_name);
  const vehicle_name = stripHtml(parsed.data.vehicle_name || "");
  const content = stripHtml(parsed.data.content);

  if (!author_name || !content) {
    return { ok: false, error: "이름과 후기 내용을 입력해 주세요." };
  }

  const supabase = await createClient();
  const payloadNew = {
    author_name,
    vehicle_name: vehicle_name || null,
    customer_name: author_name,
    vehicle_info: vehicle_name || "",
    content,
    rating: parsed.data.rating,
    status: "pending" as const,
    is_published: false,
    is_sample: false,
    admin_reply: null,
    approved_at: null,
    display_order: 0,
  };

  let { error } = await supabase.from("reviews").insert(payloadNew);

  // 004 미적용: status/author_name 없으면 레거시 칼럼으로 재시도
  if (
    error &&
    (error.code === "PGRST204" ||
      error.code === "42703" ||
      /column|schema cache/i.test(error.message || ""))
  ) {
    logSupabaseError("submitPublicReview.legacyRetry", error);
    const legacy = {
      customer_name: author_name,
      vehicle_info: vehicle_name || "",
      content,
      rating: parsed.data.rating,
      is_published: false,
      is_sample: false,
      display_order: 0,
    };
    const retry = await supabase.from("reviews").insert(legacy);
    error = retry.error;
  }

  if (error) {
    logSupabaseError("submitPublicReview", error);
    return {
      ok: false,
      error: "후기 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  cookieStore.set(RATE_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(RATE_MS / 1000),
  });

  revalidatePath("/admin/reviews");
  return {
    ok: true,
    message: "후기가 등록되었습니다. 관리자 확인 후 홈페이지에 공개됩니다.",
  };
}
