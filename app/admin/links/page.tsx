import { AdminLinksManager } from "@/components/admin/admin-links-manager";
import { listAdminCategoryOptions, listAdminLinks } from "@/lib/data/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequiredCurrentUser } from "@/lib/supabase/auth";

export default async function AdminLinksPage() {
  const user = await getRequiredCurrentUser();
  const supabase = await createServerSupabaseClient();

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
