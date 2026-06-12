/* global React */
// Medecine en Poche — Auth kit: login + register, split layout, all states.

// ---- Icon (lucide) ----
function Icon({ name, size = 18, color, style }) {
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
  return <span ref={ref} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color, lineHeight: 0, ...style }} />;
}

// ---- Field ----
function Field({ label, type = "text", value, onChange, placeholder, error, trailing, autoComplete }) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? "1px solid #EF4444" : focus ? "1px solid #3B6BE8" : "0.5px solid #EAECF0";
  const ring = error ? "0 0 0 3px #FEF2F2" : focus ? "0 0 0 3px #EEF4FF" : "none";
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#1A1D2E", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", height: 42, boxSizing: "border-box",
            padding: trailing ? "10px 42px 10px 14px" : "10px 14px",
            border, borderRadius: 10, boxShadow: ring,
            fontSize: 13, fontFamily: "var(--font-sans)", color: "#1A1D2E",
            background: "#fff", outline: "none",
            transition: "box-shadow 150ms ease, border-color 150ms ease",
          }} />
        {trailing && <div style={{ position: "absolute", right: 10, display: "flex" }}>{trailing}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

// ---- Primary button w/ loading ----
function SubmitButton({ children, loadingLabel, loading, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", height: 42, borderRadius: 10, border: "none",
        background: loading ? "#2E5DD4" : hover ? "#2E5DD4" : "#3B6BE8",
        color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans)",
        cursor: loading ? "default" : "pointer", transition: "background 150ms ease",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
      {loading && <span className="mp-spin" style={{ display: "inline-flex" }}><Icon name="loader-2" size={16} color="#fff" /></span>}
      {loading ? loadingLabel : children}
    </button>
  );
}

// ---- Google button ----
function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
function GoogleButton({ children }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      width: "100%", height: 42, borderRadius: 10, border: "0.5px solid #EAECF0",
      background: hover ? "#F7F8FC" : "#fff", color: "#1A1D2E",
      fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      transition: "background 150ms ease",
    }}><GoogleG />{children}</button>
  );
}

// ---- Divider ----
function Divider({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
      <div style={{ flex: 1, height: 0.5, background: "#EAECF0" }} />
      <span style={{ fontSize: 12, color: "#8A92A6", whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: 0.5, background: "#EAECF0" }} />
    </div>
  );
}

// ---- Password strength ----
function strengthOf(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
function StrengthBar({ pw }) {
  const s = strengthOf(pw);
  const colors = ["#EF4444", "#EF4444", "#F59E0B", "#22C55E", "#22C55E"];
  const labels = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"];
  return (
    <div style={{ marginTop: -6, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 9999,
            background: i < s ? colors[s] : "#EAECF0",
            transition: "background 250ms ease",
          }} />
        ))}
      </div>
      {pw && <div style={{ fontSize: 11, color: "#8A92A6", marginTop: 6 }}>{labels[s]}</div>}
    </div>
  );
}

Object.assign(window, { Icon, Field, SubmitButton, GoogleButton, Divider, StrengthBar });
