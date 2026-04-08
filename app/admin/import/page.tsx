import { DataImportPanel } from "@/components/panels/data-import-panel";
import { hasSupabaseEnv } from "@/lib/env";
import { getRequiredCurrentUser } from "@/lib/supabase/auth";

export default async function AdminImportPage() {
  const user = await getRequiredCurrentUser();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
            Data Import
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            普通数据导入
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-secondary)]">
            支持粘贴 JSON 或上传
            {" "}
            <code className="rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[11px] font-mono">
              .json
            </code>
            {" "}
            文件。系统会先做结构校验与预览，再按"当前用户 + 分类名 / 链接名"做幂等写入，避免重复导入造成异常重复数据。
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            "支持单个分类包或分类数组。",
            "非法 JSON、缺少字段时会给出可读错误。",
            "成功后可继续导入或刷新查看结果。",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-xs leading-5 text-[var(--ink-secondary)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <DataImportPanel
          initialUserEmail={user?.email ?? null}
          isConfigured={hasSupabaseEnv}
        />
      </section>
    </div>
  );
}
