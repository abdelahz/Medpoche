/* global React, ReactDOM, Sidebar, Topbar, Dashboard, QcmBank, Card, Badge, Avatar, ProgressBar, Button, Icon, SectionTitle */
// Admin app shell — ties sidebar + topbar + screens together.

const TITLES = {
  dashboard: "Tableau de bord", qcms: "Banque de QCMs", library: "Bibliothèque",
  dataset: "Dataset IA", students: "Étudiants", analytics: "Analytiques", settings: "Paramètres",
};

function Students() {
  const rows = [
    { n: "Sara Lahlou", e: "sara.l@etu.fr", mod: "SVT", prog: 91, last: "il y a 2 h" },
    { n: "Yanis Moreau", e: "yanis.m@etu.fr", mod: "Maths", prog: 68, last: "hier" },
    { n: "Aïcha Benali", e: "aicha.b@etu.fr", mod: "Chimie", prog: 54, last: "il y a 3 j" },
    { n: "Tom Garnier", e: "tom.g@etu.fr", mod: "Physique", prog: 77, last: "il y a 5 h" },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 100px 1fr 110px", gap: 12, padding: "11px 20px", borderBottom: "0.5px solid var(--gray-200)", background: "var(--gray-50)" }}>
          {["Étudiant", "Module fort", "Progression", "Dernière activité"].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray-600)" }}>{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 100px 1fr 110px", gap: 12, alignItems: "center", padding: "12px 20px", borderBottom: i < rows.length - 1 ? "0.5px solid var(--gray-100)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={r.n.split(" ").map(x => x[0]).join("")} size={36} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>{r.n}</div>
                <div style={{ fontSize: 11, color: "var(--gray-600)" }}>{r.e}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--gray-600)" }}>{r.mod}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}><ProgressBar value={r.prog} /></div>
              <span style={{ fontSize: 12, color: "var(--gray-600)", fontVariantNumeric: "tabular-nums", width: 32 }}>{r.prog}%</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--gray-600)" }}>{r.last}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Placeholder({ icon, label }) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "56px 20px", color: "var(--gray-400)" }}>
        <Icon name={icon} size={28} color="var(--gray-400)" />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-600)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--gray-400)" }}>Écran non inclus dans ce UI kit.</div>
      </Card>
    </div>
  );
}

function AdminApp() {
  const [current, setCurrent] = React.useState("dashboard");
  let content, action = null;
  if (current === "dashboard") content = <Dashboard />;
  else if (current === "qcms") content = <QcmBank />;
  else if (current === "students") { content = <Students />; }
  else content = <Placeholder icon={{ library: "book-open", dataset: "database", analytics: "bar-chart-2", settings: "settings" }[current]} label={TITLES[current]} />;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "var(--font-sans)" }}>
      <Sidebar current={current} onNavigate={setCurrent} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar title={TITLES[current]} action={action} />
        <main style={{ flex: 1, overflow: "auto", background: "var(--gray-50)", padding: 24 }}>
          {content}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AdminApp />);
