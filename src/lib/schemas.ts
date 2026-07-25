import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해 주세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  next: z.string().optional(),
});

export const siteSettingsSchema = z.object({
  business_name: z.string().min(1, "상호명을 입력해 주세요."),
  phone: z.string().min(1, "전화를 입력해 주세요."),
  address: z.string().min(1, "주소를 입력해 주세요."),
  hero_title: z.string().min(1),
  hero_description: z.string().min(1),
  seo_title: z.string().min(1),
  seo_description: z.string().min(1),
});

export const workCaseSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  service_id: z.string().uuid("정비 서비스를 선택해 주세요."),
  service_category: z.string().optional(),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  work_summary: z.string().optional(),
  detailed_content: z.string().optional(),
});

export const publicReviewSchema = z.object({
  author_name: z
    .string()
    .trim()
    .min(2, "이름은 2자 이상 입력해 주세요.")
    .max(20, "이름은 20자 이하로 입력해 주세요."),
  vehicle_name: z
    .string()
    .trim()
    .max(50, "차량명은 50자 이하로 입력해 주세요.")
    .optional(),
  rating: z.coerce.number().int().min(1).max(5),
  content: z
    .string()
    .trim()
    .min(10, "후기는 10자 이상 작성해 주세요.")
    .max(500, "후기는 500자 이하로 작성해 주세요."),
  /** 허니팟 — 서버 액션에서 별도 차단 */
  website: z.string().optional(),
});
