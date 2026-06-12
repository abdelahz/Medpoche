/* global React, Icon, ProgressBar, ModuleIcon, MODULE_THEME, Avatar */
// Student — Home screen ("Accueil").

function ScreenHeader({ eyebrow, title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "56px 20px 14px" }}>
      <div>
        {eyebrow && <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 3 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--gray-900)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function HomeScreen({ onStartPractice }) {
  const modules = ["maths", "chimie", "physique", "svt"];
  const modCounts = { maths: 312, chimie: 248, physique: 196, svt: 284 };
  return (
    <div>
      <ScreenHeader eyebrow="Bonjour Sara" title="Accueil"
        right={<Avatar initials="SL" size={40} />} />

      {/* Daily goal */}
      <div style={{ margin: "0 20px 18px", borderRadius: 16, padding: "18px 20px", background: "var(--primary-500)", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Objectif du jour</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>14 / 20 QCMs</div>
          </div>
          <Icon name="flame" size={26} color="#fff" />
        </div>
        <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "70%", borderRadius: 9999, background: "#fff" }} />
        </div>
      </div>

      {/* Resume card */}
      <div onClick={onStartPractice} style={{ margin: "0 20px 22px", borderRadius: 12, border: "0.5px solid var(--gray-200)", background: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <ModuleIcon mod="svt" size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "var(--gray-600)", marginBottom: 2 }}>Reprendre la série</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)" }}>Biologie cellulaire</div>
          <div style={{ marginTop: 8 }}><ProgressBar value={60} color="#10B981" track="#E7F8F1" /></div>
        </div>
        <Icon name="play" size={20} color="var(--primary-500)" />
      </div>

      {/* Modules */}
      <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--gray-900)", margin: 0 }}>Modules</h2>
        <span style={{ fontSize: 12, color: "var(--primary-500)", fontWeight: 500 }}>Tout voir</span>
      </div>
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {modules.map(m => {
          const t = MODULE_THEME[m];
          return (
            <div key={m} onClick={onStartPractice} style={{ borderRadius: 12, border: "0.5px solid var(--gray-200)", background: "#fff", padding: 14, cursor: "pointer" }}>
              <ModuleIcon mod={m} size={38} radius={10} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)", marginTop: 12 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "var(--gray-600)", marginTop: 2 }}>{modCounts[m]} QCMs</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, ScreenHeader });
