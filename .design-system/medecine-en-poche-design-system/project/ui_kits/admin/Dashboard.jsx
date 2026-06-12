/* global React, Icon, Card, StatCard, Badge, ProgressBar, Avatar */
// Admin dashboard screen.

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--gray-900)", margin: 0 }}>{children}</h2>
      {right}
    </div>
  );
}

function Dashboard() {
  const recent = [
    { q: "Métabolisme du glucose et glycolyse", mod: "svt", modLabel: "SVT", status: "published" },
    { q: "Équilibre acido-basique d'une solution", mod: "chimie", modLabel: "Chimie", status: "published" },
    { q: "Lois de Newton — référentiel galiléen", mod: "physique", modLabel: "Physique", status: "flagged" },
    { q: "Intégrales et primitives usuelles", mod: "maths", modLabel: "Maths", status: "published" },
  ];
  const modules = [
    { label: "Mathématiques", pct: 82, color: "#3B6BE8" },
    { label: "Chimie", pct: 64, color: "#0EA5E9" },
    { label: "Physique", pct: 57, color: "#8B5CF6" },
    { label: "SVT", pct: 91, color: "#10B981" },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon="users" tone="success" value="328" label="Étudiants actifs" delta="+12 cette semaine" />
        <StatCard icon="file-text" tone="info" value="1 240" label="QCMs publiés" delta="+38 ce mois" />
        <StatCard icon="flag" tone="warning" value="7" label="QCMs signalés" delta="3 nouveaux" deltaTone="down" />
        <StatCard icon="target" tone="info" value="68%" label="Taux de réussite moyen" delta="+4 pts" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        {/* Recent QCMs */}
        <Card>
          <SectionTitle right={<span style={{ fontSize: 12, color: "var(--primary-500)", cursor: "pointer", fontWeight: 500 }}>Voir tout</span>}>QCMs récents</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recent.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
                borderBottom: i < recent.length - 1 ? "0.5px solid var(--gray-100)" : "none",
              }}>
                <Badge variant={r.mod}>{r.modLabel}</Badge>
                <span style={{ fontSize: 13, color: "var(--gray-900)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.q}</span>
                <Badge variant={r.status} dot>{r.status === "published" ? "Publié" : "Signalé"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Module coverage */}
        <Card>
          <SectionTitle>Couverture par module</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {modules.map((m, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 13, color: "var(--gray-900)" }}>{m.label}</span>
                  <span style={{ fontSize: 12, color: "var(--gray-600)", fontVariantNumeric: "tabular-nums" }}>{m.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: "var(--gray-100)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.pct}%`, borderRadius: 9999, background: m.color, transition: "width 400ms ease" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, SectionTitle });
