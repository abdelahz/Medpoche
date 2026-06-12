/* global React, Icon, Avatar */
// Admin sidebar — white, 240px expanded / 60px collapsed, localStorage persistence.

function NavItem({ icon, label, active, collapsed, onClick }) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? "var(--primary-50)" : hover ? "var(--gray-50)" : "transparent";
  const color = active ? "var(--primary-600)" : "var(--gray-600)";
  const iconColor = active ? "var(--primary-500)" : hover ? "var(--gray-600)" : "var(--gray-400)";
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={collapsed ? label : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "8px 0" : "8px 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 8, background: bg, color, cursor: "pointer",
        fontSize: 13, fontWeight: 500,
        borderLeft: active ? "2px solid var(--primary-500)" : "2px solid transparent",
        borderTopLeftRadius: active ? 0 : 8, borderBottomLeftRadius: active ? 0 : 8,
        transition: "background 150ms ease",
      }}>
      <Icon name={icon} size={20} color={iconColor} />
      {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
    </div>
  );
}

function Sidebar({ current, onNavigate }) {
  const [collapsed, setCollapsed] = React.useState(() => localStorage.getItem("sidebar-collapsed") === "1");
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  };
  const items = [
    { id: "dashboard", icon: "layout-dashboard", label: "Tableau de bord" },
    { id: "qcms", icon: "file-text", label: "QCMs" },
    { id: "library", icon: "book-open", label: "Bibliothèque" },
    { id: "dataset", icon: "database", label: "Dataset IA" },
    { id: "students", icon: "users", label: "Étudiants" },
    { id: "analytics", icon: "bar-chart-2", label: "Analytiques" },
    { id: "settings", icon: "settings", label: "Paramètres" },
  ];
  return (
    <aside style={{
      width: collapsed ? 60 : 240, flexShrink: 0, background: "#fff",
      borderRight: "0.5px solid var(--gray-200)", display: "flex", flexDirection: "column",
      transition: "width 200ms ease", height: "100%",
    }}>
      {/* Logo area */}
      <div style={{
        height: 56, borderBottom: "0.5px solid var(--gray-200)",
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? 0 : "0 14px 0 16px",
      }}>
        {collapsed
          ? <span style={{ fontSize: 16, fontWeight: 700, color: "var(--primary-500)" }}>M</span>
          : <span style={{ fontSize: 15, fontWeight: 600, color: "var(--gray-900)" }}>MedenPoche</span>}
        {!collapsed && (
          <span onClick={toggle} style={{ cursor: "pointer", color: "var(--gray-400)", display: "flex" }}>
            <Icon name="panel-left-close" size={18} />
          </span>
        )}
      </div>
      {/* collapsed expander */}
      {collapsed && (
        <div onClick={toggle} style={{ display: "flex", justifyContent: "center", padding: "8px 0", cursor: "pointer", color: "var(--gray-400)" }}>
          <Icon name="panel-left-open" size={18} />
        </div>
      )}
      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: collapsed ? "10px 8px" : "12px 12px", flex: 1 }}>
        {items.map(it => (
          <NavItem key={it.id} {...it} collapsed={collapsed} active={current === it.id} onClick={() => onNavigate(it.id)} />
        ))}
      </nav>
      {/* User footer */}
      <div style={{
        borderTop: "0.5px solid var(--gray-200)", padding: 12,
        display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <Avatar initials="LM" size={collapsed ? 32 : 36} />
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", whiteSpace: "nowrap" }}>Dr. Leïla M.</div>
            <div style={{ fontSize: 11, color: "var(--gray-600)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>leila@medenpoche.fr</div>
          </div>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
