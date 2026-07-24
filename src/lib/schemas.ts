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
