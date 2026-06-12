/* global React */
// Student kit primitives — Icon (lucide), Badge, ProgressBar, Avatar, module helpers.

function Icon({ name, size = 20, color, style, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = "";
    const i = document.createElement("i");
    i.setAttribute("data-lucide", name);
    el.appendChild(i);
    window.lucide.createIcons({ root: el });
    const svg = el.querySelector("svg");
    if (svg) { svg.setAttribute("width", size); svg.setAttribute("height", size); }
  });
  return <span ref={ref} className={className}
    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color, lineHeight: 0, ...style }} />;
}

const MODULE_THEME = {
  maths:    { label: "Mathématiques", short: "Maths", color: "#3B6BE8", bg: "#EEF4FF", icon: "sigma" },
  chimie:   { label: "Chimie", short: "Chimie", color: "#0EA5E9", bg: "#E6F6FE", icon: "flask-conical" },
  physique: { label: "Physique", short: "Physique", color: "#8B5CF6", bg: "#F3EEFE", icon: "atom" },
  svt:      { label: "SVT", short: "SVT", color: "#10B981", bg: "#E7F8F1", icon: "leaf" },
};

function ModuleIcon({ mod, size = 44, radius = 12 }) {
  const t = MODULE_THEME[mod];
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: t.bg, color: t.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={t.icon} size={Math.round(size * 0.46)} />
    </div>
  );
}

function ProgressBar({ value = 0, height = 6, color = "var(--primary-500)", track = "var(--primary-50)" }) {
  return (
    <div style={{ height, borderRadius: 9999, background: track, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${value}%`, borderRadius: 9999, background: color, transition: "width 400ms ease" }} />
    </div>
  );
}

function Avatar({ initials, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 9999, flexShrink: 0, background: "var(--primary-50)", color: "var(--primary-600)", fontWeight: 600, fontSize: Math.round(size * 0.4), display: "flex", alignItems: "center", justifyContent: "center" }}>{initials}</div>
  );
}

function Badge({ children, bg = "var(--gray-100)", color = "var(--gray-600)", style }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 500, background: bg, color, ...style }}>{children}</span>;
}

Object.assign(window, { Icon, Badge, ProgressBar, Avatar, ModuleIcon, MODULE_THEME });
