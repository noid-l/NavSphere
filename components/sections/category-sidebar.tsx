import type { CategoryGroup } from "@/lib/types";

type TreeNode =
  | { type: "parent"; label: string; children: SidebarItem[] }
  | { type: "leaf"; label: string; id: string };

type SidebarItem = {
  label: string;
  id: string;
};

type CategorySidebarProps = {
  groups: CategoryGroup[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  className?: string;
};

function buildTree(groups: CategoryGroup[]): TreeNode[] {
  const root: TreeNode[] = [];
  const parentMap = new Map<string, SidebarItem[]>();

  for (const group of groups) {
    const name = group.category.name;
    const parts = name.split(/\s*\/\s*/).map((s) => s.trim());

    if (parts.length < 2) {
      root.push({ type: "leaf", label: name, id: group.category.id });
      continue;
    }

    const parentLabel = parts[0];
    const childLabel = parts.slice(1).join(" / ");

    if (!parentMap.has(parentLabel)) {
      parentMap.set(parentLabel, []);
      root.push({
        type: "parent",
        label: parentLabel,
        children: parentMap.get(parentLabel)!,
      });
    }

    parentMap.get(parentLabel)!.push({
      label: childLabel,
      id: group.category.id,
    });
  }

  return root;
}

export function CategorySidebar({
  groups,
  activeId,
  onNavigate,
  className = "",
}: CategorySidebarProps) {
  const tree = buildTree(groups);

  return (
    <nav className={`cat-sidebar ${className}`} aria-label="分类导航">
      {tree.map((node) => {
        if (node.type === "leaf") {
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onNavigate(node.id)}
              className={`cat-sidebar-item cat-sidebar-leaf ${activeId === node.id ? "cat-sidebar-item--active" : ""}`}
            >
              <span className="cat-sidebar-dot" />
              <span className="truncate">{node.label}</span>
            </button>
          );
        }

        return (
          <div key={node.label} className="cat-sidebar-group">
            <div className="cat-sidebar-group-label">{node.label}</div>
            <div className="cat-sidebar-group-children">
              {node.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onNavigate(child.id)}
                  className={`cat-sidebar-item ${activeId === child.id ? "cat-sidebar-item--active" : ""}`}
                >
                  <span className="cat-sidebar-dot" />
                  <span className="truncate">{child.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
