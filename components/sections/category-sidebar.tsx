import type { CategoryGroup } from "@/lib/types";

type TreeNode = {
  key: string;
  label: string;
  id: string | null;
  children: TreeNode[];
};

type CategorySidebarProps = {
  groups: CategoryGroup[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  className?: string;
};

type MutableTreeNode = TreeNode & {
  childMap: Map<string, MutableTreeNode>;
};

function splitCategoryPath(name: string) {
  const parts = name
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [name.trim()];
}

function buildTree(groups: CategoryGroup[]): TreeNode[] {
  const root: MutableTreeNode[] = [];
  const rootMap = new Map<string, MutableTreeNode>();

  for (const group of groups) {
    const parts = splitCategoryPath(group.category.name);
    let currentPath = "";
    let siblings = root;
    let siblingMap = rootMap;

    for (const [index, part] of parts.entries()) {
      currentPath = currentPath ? `${currentPath} / ${part}` : part;

      let node = siblingMap.get(currentPath);

      if (!node) {
        node = {
          key: currentPath,
          label: part,
          id: null,
          children: [],
          childMap: new Map<string, MutableTreeNode>(),
        };
        siblingMap.set(currentPath, node);
        siblings.push(node);
      }

      if (index === parts.length - 1) {
        node.id = group.category.id;
      }

      siblings = node.children as MutableTreeNode[];
      siblingMap = node.childMap;
    }
  }

  function normalize(nodes: MutableTreeNode[]): TreeNode[] {
    return nodes.map(({ childMap: _childMap, children, ...node }) => ({
      ...node,
      children: normalize(children as MutableTreeNode[]),
    }));
  }

  return normalize(root);
}

function hasActiveNode(node: TreeNode, activeId: string | null): boolean {
  if (!activeId) {
    return false;
  }

  if (node.id === activeId) {
    return true;
  }

  return node.children.some((child) => hasActiveNode(child, activeId));
}

function getNavigableId(node: TreeNode): string | null {
  if (node.id) {
    return node.id;
  }

  for (const child of node.children) {
    const childNavigableId = getNavigableId(child);

    if (childNavigableId) {
      return childNavigableId;
    }
  }

  return null;
}

type SidebarNodeProps = {
  node: TreeNode;
  activeId: string | null;
  depth: number;
  onNavigate: (id: string) => void;
};

function SidebarNode({
  node,
  activeId,
  depth,
  onNavigate,
}: SidebarNodeProps) {
  const isActive = node.id === activeId;
  const isBranchActive = !isActive && hasActiveNode(node, activeId);
  const navigableId = getNavigableId(node);
  const itemClassName = [
    "cat-sidebar-item",
    isActive ? "cat-sidebar-item--active" : "",
    isBranchActive ? "cat-sidebar-item--branch-active" : "",
    navigableId ? "" : "cat-sidebar-item--label",
  ]
    .filter(Boolean)
    .join(" ");
  const itemStyle = {
    paddingLeft: `${12 + depth * 16}px`,
  };

  return (
    <div className="cat-sidebar-group">
      {navigableId ? (
        <button
          type="button"
          onClick={() => onNavigate(navigableId)}
          className={itemClassName}
          style={itemStyle}
        >
          <span className="cat-sidebar-dot" />
          <span className="truncate">{node.label}</span>
        </button>
      ) : (
        <div className={itemClassName} style={itemStyle}>
          <span className="cat-sidebar-dot" />
          <span className="truncate">{node.label}</span>
        </div>
      )}

      {node.children.length > 0 && (
        <div className="cat-sidebar-group-children">
          {node.children.map((child) => (
            <SidebarNode
              key={child.key}
              node={child}
              activeId={activeId}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
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
      {tree.map((node) => (
        <SidebarNode
          key={node.key}
          node={node}
          activeId={activeId}
          depth={0}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
