/* global React, Icon, MODULE_THEME */
// Student — Practice / MCQ flow ("S'entraîner"). Core interactive screen.

const QUESTIONS = [
  {
    mod: "svt",
    q: "Quelle structure cellulaire est le principal siège de la respiration cellulaire ?",
    options: ["Le noyau", "La mitochondrie", "Le réticulum endoplasmique", "L'appareil de Golgi"],
    correct: 1,
    explain: "La mitochondrie est le siège de la phosphorylation oxydative, qui produit l'essentiel de l'ATP cellulaire.",
  },
  {
    mod: "svt",
    q: "L'ADN polymérase intervient principalement lors de :",
    options: ["La traduction", "La réplication de l'ADN", "L'épissage", "La glycolyse"],
    correct: 1,
    explain: "L'ADN polymérase catalyse la synthèse du brin complémentaire pendant la réplication de l'ADN.",
  },
];

function McqOption({ k, text, state, onClick }) {
  const styles = {
    default:  { border: "0.5px solid var(--gray-200)", bg: "#fff", color: "var(--gray-900)", kb: "var(--gray-100)", kc: "var(--gray-600)" },
    selected: { border: "1.5px solid var(--primary-500)", bg: "var(--primary-50)", color: "var(--primary-900)", kb: "var(--primary-500)", kc: "#fff" },
    correct:  { border: "1.5px solid var(--success-solid)", bg: "var(--success-bg)", color: "var(--success-text)", kb: "var(--success-solid)", kc: "#fff" },
    wrong:    { border: "1.5px solid var(--danger-solid)", bg: "var(--danger-bg)", color: "var(--danger-text)", kb: "var(--danger-solid)", kc: "#fff" },
  };
  const s = styles[state];
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
      borderRadius: 10, border: s.border, background: s.bg, color: s.color,
      fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 150ms ease",
    }}>
      <span style={{ width: 22, height: 22, borderRadius: 9999, background: s.kb, color: s.kc, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{k}</span>
      <span style={{ flex: 1 }}>{text}</span>
      {state === "correct" && <Icon name="check" size={18} />}
      {state === "wrong" && <Icon name="x" size={18} />}
    </div>
  );
}

function PracticeScreen({ onExit }) {
  const [idx, setIdx] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [validated, setValidated] = React.useState(false);
  const total = QUESTIONS.length;
  const item = QUESTIONS[idx];
  const t = MODULE_THEME[item.mod];

  const optState = (i) => {
    if (!validated) return selected === i ? "selected" : "default";
    if (i === item.correct) return "correct";
    if (i === selected) return "wrong";
    return "default";
  };

  const next = () => {
    if (idx + 1 < total) { setIdx(idx + 1); setSelected(null); setValidated(false); }
    else onExit();
  };
  const isCorrect = validated && selected === item.correct;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      {/* header */}
      <div style={{ padding: "56px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <span onClick={onExit} style={{ cursor: "pointer", color: "var(--gray-400)", display: "flex" }}><Icon name="x" size={22} /></span>
          <div style={{ flex: 1, height: 6, borderRadius: 9999, background: "var(--gray-100)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((idx + (validated ? 1 : 0)) / total) * 100}%`, background: "var(--primary-500)", borderRadius: 9999, transition: "width 400ms ease" }} />
          </div>
          <span style={{ fontSize: 13, color: "var(--gray-600)", fontVariantNumeric: "tabular-nums" }}>{idx + 1}/{total}</span>
        </div>
        <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.color }}>{t.label}</span>
      </div>

      {/* question + options */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: 19, fontWeight: 600, color: "var(--gray-900)", lineHeight: 1.4, margin: "8px 0 22px" }}>{item.q}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {item.options.map((o, i) => (
            <McqOption key={i} k={"ABCD"[i]} text={o} state={optState(i)}
              onClick={() => { if (!validated) setSelected(i); }} />
          ))}
        </div>

        {validated && (
          <div style={{ marginTop: 18, borderRadius: 12, padding: "14px 16px", background: isCorrect ? "var(--success-bg)" : "var(--info-bg)", border: `0.5px solid ${isCorrect ? "var(--success-border)" : "var(--info-border)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Icon name={isCorrect ? "check-circle-2" : "info"} size={16} color={isCorrect ? "var(--success-text)" : "var(--info-text)"} />
              <span style={{ fontSize: 13, fontWeight: 600, color: isCorrect ? "var(--success-text)" : "var(--info-text)" }}>{isCorrect ? "Bonne réponse" : "Explication"}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--gray-900)", lineHeight: 1.5, margin: 0 }}>{item.explain}</p>
          </div>
        )}
      </div>

      {/* footer action */}
      <div style={{ padding: "12px 20px 16px", borderTop: "0.5px solid var(--gray-200)" }}>
        {!validated ? (
          <button onClick={() => selected !== null && setValidated(true)} disabled={selected === null} style={{
            width: "100%", height: 46, borderRadius: 10, border: "none", cursor: selected === null ? "default" : "pointer",
            background: selected === null ? "var(--gray-200)" : "var(--primary-500)", color: selected === null ? "var(--gray-400)" : "#fff",
            fontSize: 15, fontWeight: 600, fontFamily: "var(--font-sans)", transition: "background 150ms ease",
          }}>Valider</button>
        ) : (
          <button onClick={next} style={{
            width: "100%", height: 46, borderRadius: 10, border: "none", cursor: "pointer",
            background: "var(--primary-500)", color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-sans)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>{idx + 1 < total ? "Question suivante" : "Terminer"}<Icon name="arrow-right" size={18} color="#fff" /></button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PracticeScreen });
