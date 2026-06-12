/* global React, Icon, ScreenHeader, ModuleIcon, MODULE_THEME, ProgressBar */
// Student — AI tutor, Progress, Library screens.

// ---------- AI tutor ("IA") ----------
function AiScreen() {
  const [messages, setMessages] = React.useState([
    { role: "ai", text: "Bonjour Sara ! Pose-moi une question sur tes cours ou un QCM, je t'explique pas à pas." },
    { role: "user", text: "Pourquoi la mitochondrie produit-elle de l'ATP ?" },
    { role: "ai", text: "Parce qu'elle abrite la chaîne respiratoire : le gradient de protons créé à travers sa membrane interne fait tourner l'ATP synthase, qui phosphoryle l'ADP en ATP." },
  ]);
  const [draft, setDraft] = React.useState("");
  const scroller = React.useRef(null);
  React.useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [messages]);
  const send = () => {
    if (!draft.trim()) return;
    const q = draft.trim();
    setMessages(m => [...m, { role: "user", text: q }]);
    setDraft("");
    setTimeout(() => setMessages(m => [...m, { role: "ai", text: "Bonne question — voici comment l'aborder étape par étape, en repartant des définitions clés du cours." }]), 500);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      <div style={{ padding: "56px 20px 14px", borderBottom: "0.5px solid var(--gray-200)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-50)", color: "var(--primary-500)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="sparkles" size={20} /></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gray-900)" }}>Assistant IA</div>
          <div style={{ fontSize: 12, color: "var(--gray-600)" }}>Tuteur de révision</div>
        </div>
      </div>
      <div ref={scroller} style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div style={{
              padding: "11px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.5,
              background: m.role === "user" ? "var(--primary-500)" : "var(--gray-100)",
              color: m.role === "user" ? "#fff" : "var(--gray-900)",
              borderBottomRightRadius: m.role === "user" ? 4 : 14,
              borderBottomLeftRadius: m.role === "user" ? 14 : 4,
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 16px 14px", borderTop: "0.5px solid var(--gray-200)", display: "flex", alignItems: "center", gap: 10 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Pose ta question…" style={{
            flex: 1, height: 42, padding: "9px 14px", border: "0.5px solid var(--gray-200)", borderRadius: 9999,
            fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--gray-900)", outline: "none", background: "var(--gray-50)",
          }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: 9999, border: "none", background: "var(--primary-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="arrow-up" size={20} color="#fff" /></button>
      </div>
    </div>
  );
}

// ---------- Progress ("Progrès") ----------
function ProgressScreen() {
  const mastery = [
    { mod: "svt", pct: 91 }, { mod: "maths", pct: 82 }, { mod: "chimie", pct: 64 }, { mod: "physique", pct: 57 },
  ];
  return (
    <div style={{ paddingBottom: 12 }}>
      <ScreenHeader title="Progrès" />
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          { ic: "flame", tone: "warning", v: "12", l: "Jours d'affilée" },
          { ic: "circle-check", tone: "success", v: "74%", l: "Réussite globale" },
        ].map((s, i) => {
          const tone = { warning: ["var(--warning-bg)", "var(--warning-text)"], success: ["var(--success-bg)", "var(--success-text)"] }[s.tone];
          return (
            <div key={i} style={{ borderRadius: 12, border: "0.5px solid var(--gray-200)", background: "#fff", padding: "14px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: tone[0], color: tone[1], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Icon name={s.ic} size={18} /></div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gray-900)", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 5 }}>{s.l}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 20px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--gray-900)", margin: "0 0 14px" }}>Maîtrise par module</h2>
        <div style={{ borderRadius: 12, border: "0.5px solid var(--gray-200)", background: "#fff", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {mastery.map((m, i) => {
            const t = MODULE_THEME[m.mod];
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 13, color: "var(--gray-900)" }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: "var(--gray-600)", fontVariantNumeric: "tabular-nums" }}>{m.pct}%</span>
                </div>
                <ProgressBar value={m.pct} color={t.color} track={t.bg} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Library ("Bibliothèque") ----------
function LibraryScreen() {
  const items = [
    { mod: "svt", title: "Biologie cellulaire", chapters: 8 },
    { mod: "chimie", title: "Réactions acido-basiques", chapters: 6 },
    { mod: "maths", title: "Calcul intégral", chapters: 5 },
    { mod: "physique", title: "Mécanique du point", chapters: 7 },
  ];
  return (
    <div style={{ paddingBottom: 12 }}>
      <ScreenHeader title="Bibliothèque" />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => {
          const t = MODULE_THEME[it.mod];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, borderRadius: 12, border: "0.5px solid var(--gray-200)", background: "#fff", padding: "14px 16px", cursor: "pointer" }}>
              <ModuleIcon mod={it.mod} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)" }}>{it.title}</div>
                <div style={{ fontSize: 11, color: "var(--gray-600)", marginTop: 2 }}>{t.label} · {it.chapters} chapitres</div>
              </div>
              <Icon name="chevron-right" size={18} color="var(--gray-400)" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { AiScreen, ProgressScreen, LibraryScreen });
