import { AdminLinksManager } from "@/components/admin/admin-links-manager";
import { listAdminCategoryOptions, listAdminLinks } from "@/lib/data/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLinksPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [links, categoryOptions] = await Promise.all([
    listAdminLinks(supabase, user.id),
    listAdminCategoryOptions(supabase, user.id),
  ]);

  return (
    <AdminLinksManager
      initialLinks={links}
      categoryOptions={categoryOptions}
    />
  );
}
