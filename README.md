# 코리아오토미션 / KOREA AUTO MISSION

부산 사상구 수입차·국산차 자동변속기 및 구동계 전문 정비소 웹사이트입니다.

## 기술 스택

- Next.js App Router (TypeScript)
- Tailwind CSS
- Supabase (Database, Auth, Storage)
- `@supabase/ssr` + Publishable Key
- Zod, React Hook Form, Framer Motion

## 1. 환경 변수

`.env.example`을 복사해 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

필수 변수:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 사용하지 않습니다. Publishable Key만 사용합니다.

## 2. Supabase SQL 실행

Supabase Dashboard → SQL Editor에서 **순서대로** 실행합니다.

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_service_id_and_sort_order.sql`
3. `supabase/migrations/003_business_hours.sql`
4. `supabase/migrations/004_reviews_moderation.sql`
4. `supabase/seed.sql` (초기 데이터가 없을 때만 필요)

마이그레이션에 포함되는 내용:

- 테이블 / 인덱스 / RLS
- Storage `images` 버킷
- Storage 정책 (공개 읽기, 인증 사용자 업로드·수정·삭제)
- 정비 서비스 `service_id` 연결 및 `sort_order`
- 영업시간 분리 (`weekday_hours` / `saturday_hours` / `holiday_hours`)

## 3. 관리자 계정 생성

Supabase Dashboard → Authentication → Users → Add user

- 이메일 / 비밀번호로 관리자 계정을 생성합니다.
- 해당 계정으로 `/admin/login`에 로그인합니다.

## 4. 로컬 실행

```bash
npm install
npm run dev
```

주요 주소:

- 홈: http://localhost:3000
- 작업사례: http://localhost:3000/works
- 관리자 로그인: http://localhost:3000/admin/login

## 5. 빌드 확인

```bash
npm run build
npm start
```

## 6. Vercel 배포

1. GitHub에 저장소를 연결합니다.
2. Vercel에서 Import Project
3. Environment Variables에 아래 3개를 등록합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (예: `https://your-domain.com`)
4. Deploy
5. 배포 후 Supabase Authentication → URL Configuration에 사이트 URL / Redirect URL을 등록합니다.

## 폴더 구조 (요약)

- `src/app` — 공개/관리자 라우트
- `src/components` — UI
- `src/lib` — Supabase, 데이터, 액션, 기본값
- `supabase/migrations` — SQL 스키마
- `supabase/seed.sql` — 초기 콘텐츠

## 이미지 업로드

브라우저에서 Supabase Storage `images` 버킷으로 직접 업로드합니다.

- 서버 액션으로는 메타데이터/경로만 저장합니다.
- 폴더: `hero/`, `shop/`, `services/`, `works/{id}/`, `before-after/injector/`, `before-after/intake/`, `reviews/`, `brands/`

## 콘텐츠 폴백

Supabase가 없거나 마이그레이션 전이어도 홈페이지는 기본 한국어 콘텐츠로 렌더링됩니다. 관리자 화면에는 한국어 설정 안내가 표시됩니다.
