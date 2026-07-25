import { redirect } from "next/navigation";
import { AdminShellClient } from "@/components/admin/AdminShellClient";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/utils";

export async function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <AdminShellClient title={title} description={description} configured={false}>
        {null}
      </AdminShellClient>
    );
  }

  const { user } = await requireAdmin();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <AdminShellClient title={title} description={description}>
      {children}
    </AdminShellClient>
  );
}
