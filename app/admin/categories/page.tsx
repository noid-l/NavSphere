import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";
import { listAdminCategories } from "@/lib/data/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categories = await listAdminCategories(supabase, user.id);

  return <AdminCategoriesManager initialCategories={categories} />;
}
