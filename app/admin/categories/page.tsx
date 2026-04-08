import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";
import { listAdminCategories } from "@/lib/data/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequiredCurrentUser } from "@/lib/supabase/auth";

export default async function AdminCategoriesPage() {
  const user = await getRequiredCurrentUser();
  const supabase = await createServerSupabaseClient();

  const categories = await listAdminCategories(supabase, user.id);

  return <AdminCategoriesManager initialCategories={categories} />;
}
