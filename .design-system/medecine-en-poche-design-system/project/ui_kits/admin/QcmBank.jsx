/* global React, Icon, Card, Badge, Button, Input */
// Admin QCM bank — searchable list + filter chips + detail/editor modal.

const MODULES = [
  { id: "all", label: "Tous" },
  { id: "maths", label: "Mathématiques" },
  { id: "chimie", label: "Chimie" },
  { id: "physique", label: "Physique" },
  { id: "svt", label: "SVT" },
];

const QCMS = [
  { id: 1, mod: "svt", modLabel: "SVT", q: "Quelle structure cellulaire est le siège de la respiration ?", status: "published", uses: 412, rate: 74 },
  { id: 2, mod: "chimie", modLabel: "Chimie", q: "Le pH d'une solution tampon dépend principalement de…", status: "published", uses: 388, rate: 61 },
  { id: 3, mod: "physique", modLabel: "Physique", q: "Dans un référentiel galiléen, un corps isolé…", status: "flagged", uses: 203, rate: 48 },
  { id: 4, mod: "maths", modLabel: "Maths", q: "La primitive de cos(x) sur ℝ est…", status: "published", uses: 521, rate: 83 },
  { id: 5, mod: "svt", modLabel: "SVT", q: "L'ADN polymérase intervient lors de…", status: "published", uses: 296, rate: 69 },
  { id: 6, mod: "chimie", modLabel: "Chimie", q: "Une réaction d'oxydoréduction met en jeu…", status: "error", uses: 51, rate: 0 },
];

function FilterChip({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "var(--font-sans)", cursor: "pointer",
      padding: "6px 13px", borderRadius: 9999, fontSize: 12, fontWeight: 500,
      border: active ? "0.5px solid var(--primary-100)" : "0.5px solid var(--gray-200)",
      background: active ? "var(--primary-50)" : "#fff",
      color: active ? "var(--primary-600)" : "var(--gray-600)",
      transition: "background 150ms ease, border-color 150ms ease",
    }}>{children}</button>
  );
}

function statusBadge(s) {
  if (s === "published") return <Badge variant="published" dot>Publié</Badge>;
  if (s === "flagged") return <Badge variant="flagged" dot>Signalé</Badge>;
  return <Badge variant="error" dot>Erreur</Badge>;
}

function QcmBank() {
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(null);
  const list = QCMS.filter(x =>
    (filter === "all" || x.mod === filter) &&
    x.q.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* toolbar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div style={{ flex: "0 0 300px" }}>
          <Input icon="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un QCM…" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODULES.map(m => <FilterChip key={m.id} active={filter === m.id} onClick={() => setFilter(m.id)}>{m.label}</FilterChip>)}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Button icon="plus" onClick={() => setOpen({ id: 0, mod: "svt", modLabel: "SVT", q: "Nouvelle question…", status: "draft" })}>Nouveau QCM</Button>
        </div>
      </div>

      {/* table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 110px 90px 110px", gap: 12, padding: "11px 20px", borderBottom: "0.5px solid var(--gray-200)", background: "var(--gray-50)" }}>
          {["Module", "Question", "État", "Réussite", "Utilisations"].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray-600)", textAlign: i >= 3 ? "right" : "left" }}>{h}</span>
          ))}
        </div>
        {list.map((x, i) => (
          <div key={x.id} onClick={() => setOpen(x)} className="qcm-row" style={{
            display: "grid", gridTemplateColumns: "120px 1fr 110px 90px 110px", gap: 12, alignItems: "center",
            padding: "13px 20px", cursor: "pointer",
            borderBottom: i < list.length - 1 ? "0.5px solid var(--gray-100)" : "none",
          }}>
            <span><Badge variant={x.mod}>{x.modLabel}</Badge></span>
            <span style={{ fontSize: 13, color: "var(--gray-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.q}</span>
            <span>{statusBadge(x.status)}</span>
            <span style={{ fontSize: 13, color: "var(--gray-900)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{x.rate}%</span>
            <span style={{ fontSize: 13, color: "var(--gray-600)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{x.uses}</span>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--gray-600)", fontSize: 13 }}>Aucun QCM ne correspond.</div>}
      </Card>

      {open && <QcmModal qcm={open} onClose={() => setOpen(null)} />}
      <style>{`.qcm-row:hover{background:var(--gray-50);}`}</style>
    </div>
  );
}

// ---- Editor / detail modal with MCQ options ----
function QcmModal({ qcm, onClose }) {
  const [answers] = React.useState([
    { k: "A", text: "La mitochondrie", state: "correct" },
    { k: "B", text: "Le noyau", state: "default" },
    { k: "C", text: "Le réticulum endoplasmique", state: "default" },
    { k: "D", text: "L'appareil de Golgi", state: "default" },
  ]);
  const stateStyle = {
    default: { border: "0.5px solid var(--gray-200)", background: "#fff", color: "var(--gray-900)", k: { bg: "var(--gray-100)", c: "var(--gray-600)" } },
    correct: { border: "1.5px solid var(--success-solid)", background: "var(--success-bg)", color: "var(--success-text)", k: { bg: "var(--success-solid)", c: "#fff" } },
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,29,46,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,.10)",
        width: 600, maxWidth: "100%", maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.5px solid var(--gray-200)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge variant={qcm.mod}>{qcm.modLabel}</Badge>
            {qcm.status !== "draft" && statusBadge(qcm.status)}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: "var(--gray-400)", display: "flex" }}><Icon name="x" size={18} /></span>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-600)" }}>Énoncé</label>
          <div style={{ marginTop: 8, marginBottom: 18, padding: "12px 14px", border: "0.5px solid var(--gray-200)", borderRadius: 8, fontSize: 14, color: "var(--gray-900)", lineHeight: 1.5 }}>{qcm.q}</div>
          <label style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-600)" }}>Réponses</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {answers.map(a => {
              const s = stateStyle[a.state];
              return (
                <div key={a.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 10, border: s.border, background: s.background, color: s.color, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 9999, background: s.k.bg, color: s.k.c, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.k}</span>
                  {a.text}
                  {a.state === "correct" && <span style={{ marginLeft: "auto", display: "flex" }}><Icon name="check" size={16} /></span>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "0.5px solid var(--gray-200)" }}>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={onClose}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { QcmBank });
