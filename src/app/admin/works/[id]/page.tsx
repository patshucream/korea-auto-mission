import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** 기존 /admin/works/[id] → /edit 경로로 통일 */
export default async function AdminWorkIdRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/works/${id}/edit`);
}
