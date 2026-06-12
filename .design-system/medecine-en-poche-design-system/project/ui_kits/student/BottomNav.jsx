/* global React, Icon */
// Student bottom navigation bar — 60px, white, 5 tabs.

function BottomNav({ current, onNavigate }) {
  const items = [
    { id: "home", icon: "home", label: "Accueil" },
    { id: "practice", icon: "zap", label: "S'entraîner" },
    { id: "library", icon: "book-open", label: "Bibliothèque" },
    { id: "ai", icon: "message-square", label: "IA" },
    { id: "progress", icon: "trending-up", label: "Progrès" },
  ];
  return (
    <div style={{
      height: 60, background: "#fff", borderTop: "0.5px solid var(--gray-200)",
      display: "flex", flexShrink: 0,
    }}>
      {items.map(it => {
        const on = current === it.id;
        const color = on ? "var(--primary-500)" : "var(--gray-400)";
        return (
          <div key={it.id} onClick={() => onNavigate(it.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, cursor: "pointer", color, paddingTop: 2,
          }}>
            <Icon name={it.icon} size={22} color={color} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{it.label}</span>
            <span style={{ width: 4, height: 4, borderRadius: 9999, background: on ? "var(--primary-500)" : "transparent" }} />
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { BottomNav });
