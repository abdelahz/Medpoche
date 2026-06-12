/* global React */
// Medecine en Poche — shared primitives (Icon, Button, Badge, Card, StatCard, Input, Avatar, Progress)
// Loaded as text/babel. Exports to window at the bottom.

// ---- Icon: lucide outline, inherits currentColor, 1.5px stroke ----
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

// ---- Button ----
function Button({ variant = "primary", size = "md", icon, children, onClick, style, type }) {
  const [hover, setHover] = React.useState(false);
  const sizes = {
    sm: { padding: "7px 12px", fontSize: 12 },
    md: { padding: "9px 18px", fontSize: 13 },
    lg: { padding: "11px 22px", fontSize: 14 },
  };
  const variants = {
    primary:   { bg: "var(--primary-500)", color: "#fff", border: "none", hoverBg: "var(--primary-600)" },
    secondary: { bg: "var(--primary-50)", color: "var(--primary-900)", border: "0.5px solid var(--primary-100)", hoverBg: "var(--primary-100)" },
    ghost:     { bg: "transparent", color: "var(--gray-600)", border: "0.5px solid var(--gray-200)", hoverBg: "var(--gray-50)" },
    danger:    { bg: "var(--danger-bg)", color: "var(--danger-text)", border: "0.5px solid var(--danger-border)", hoverBg: "#FEE2E2" },
  };
  const v = variants[variant], s = sizes[size];
  const iconOnly = icon && !children;
  return (
    <button type={type} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--font-sans)", fontWeight: 500, cursor: "pointer",
        borderRadius: 8, border: v.border, color: v.color,
        background: hover ? v.hoverBg : v.bg,
        padding: iconOnly ? (size === "sm" ? 7 : 9) : s.padding, fontSize: s.fontSize,
        display: "inline-flex", alignItems: "center", gap: 7,
        transition: "background 150ms ease, border-color 150ms ease",
        whiteSpace: "nowrap", ...style,
      }}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

// ---- Badge ----
function Badge({ variant = "default", dot, children, style }) {
  const map = {
    published: { bg: "var(--success-bg)", color: "var(--success-text)", solid: "var(--success-solid)" },
    flagged:   { bg: "var(--warning-bg)", color: "var(--warning-text)", solid: "var(--warning-solid)" },
    error:     { bg: "var(--danger-bg)", color: "var(--danger-text)", solid: "var(--danger-solid)" },
    info:      { bg: "var(--info-bg)", color: "var(--info-text)" },
    default:   { bg: "var(--gray-100)", color: "var(--gray-600)" },
    maths:     { bg: "#EEF4FF", color: "#3B6BE8" },
    chimie:    { bg: "#E6F6FE", color: "#0369A1" },
    physique:  { bg: "#F3EEFE", color: "#6D28D9" },
    svt:       { bg: "#E7F8F1", color: "#047857" },
  };
  const v = map[variant] || map.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 500,
      background: v.bg, color: v.color, ...style,
    }}>
      {dot && v.solid && <span style={{ width: 6, height: 6, borderRadius: 9999, background: v.solid }} />}
      {children}
    </span>
  );
}

// ---- Card ----
function Card({ compact, floating, children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", border: "0.5px solid var(--gray-200)", borderRadius: 12,
      padding: compact ? "12px 14px" : "16px 20px",
      boxShadow: floating ? "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)" : "none",
      ...style,
    }}>{children}</div>
  );
}

// ---- StatCard ----
function StatCard({ icon, tone = "info", value, label, delta, deltaTone = "up" }) {
  const tones = {
    info:    { bg: "var(--info-bg)", color: "var(--info-text)" },
    success: { bg: "var(--success-bg)", color: "var(--success-text)" },
    warning: { bg: "var(--warning-bg)", color: "var(--warning-text)" },
    danger:  { bg: "var(--danger-bg)", color: "var(--danger-text)" },
  };
  const t = tones[tone];
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: t.bg, color: t.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gray-900)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 5 }}>{label}</div>
      </div>
      {delta && <div style={{ fontSize: 12, fontWeight: 500, color: deltaTone === "down" ? "var(--danger-text)" : "var(--success-text)" }}>{delta}</div>}
    </Card>
  );
}

// ---- Input ----
function Input({ value, onChange, placeholder, icon, error, type = "text", style }) {
  const [focus, setFocus] = React.useState(false);
  const ring = error ? "0 0 0 3px var(--danger-bg)" : focus ? "0 0 0 3px var(--primary-50)" : "none";
  const border = error ? "1px solid var(--danger-solid)" : focus ? "1px solid var(--primary-500)" : "0.5px solid var(--gray-200)";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      {icon && <span style={{ position: "absolute", left: 11, color: "var(--gray-400)", display: "flex" }}><Icon name={icon} size={16} /></span>}
      <input type={type} value={value} placeholder={placeholder}
        onChange={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", height: 38, boxSizing: "border-box",
          padding: icon ? "9px 12px 9px 34px" : "9px 12px",
          border, borderRadius: 8, boxShadow: ring,
          fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--gray-900)",
          background: "#fff", outline: "none", transition: "box-shadow 150ms ease, border-color 150ms ease",
        }} />
    </div>
  );
}

// ---- Avatar ----
function Avatar({ initials, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999, flexShrink: 0,
      background: "var(--primary-50)", color: "var(--primary-600)",
      fontWeight: 600, fontSize: Math.round(size * 0.4),
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{initials}</div>
  );
}

// ---- ProgressBar ----
function ProgressBar({ value = 0, height = 6 }) {
  return (
    <div style={{ height, borderRadius: 9999, background: "var(--primary-50)", overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${value}%`, borderRadius: 9999, background: "var(--primary-500)", transition: "width 400ms ease" }} />
    </div>
  );
}

Object.assign(window, { Icon, Button, Badge, Card, StatCard, Input, Avatar, ProgressBar });
