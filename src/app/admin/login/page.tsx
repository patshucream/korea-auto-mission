import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white px-4 py-10">
      <div className="w-full max-w-md">
        <LoginForm
          configured={isSupabaseConfigured()}
          nextPath={params.next?.startsWith("/admin") ? params.next : "/admin"}
        />
      </div>
    </div>
  );
}
