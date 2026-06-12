/* global React, ReactDOM, Icon, Field, SubmitButton, GoogleButton, Divider, StrengthBar */
// Auth app — split layout, login/register toggle, states.

const LOGO = "../../assets/medenpoche-logo-transparent.png";

function LeftPanel() {
  return (
    <div className="auth-left" style={{
      flex: "0 0 45%", background: "#F7F8FC",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 56, position: "relative", borderRight: "0.5px solid #EAECF0",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 360 }}>
        <img src={LOGO} alt="Med En Poche" style={{ width: 208, height: "auto", display: "block" }} />
        <div style={{ width: 44, height: 3, borderRadius: 9999, background: "#6FAC35", margin: "34px 0 22px" }} />
        <h2 style={{ fontSize: 21, fontWeight: 600, color: "#145281", lineHeight: 1.45, margin: 0, letterSpacing: "-0.01em" }}>
          Votre clé d'accès à la faculté de médecine
        </h2>
      </div>
    </div>
  );
}

function MobileLogo() {
  return (
    <div className="auth-mobile-logo" style={{ display: "none", flexDirection: "column", alignItems: "center", paddingTop: 40, paddingBottom: 4, gap: 14 }}>
      <img src={LOGO} alt="Med En Poche" style={{ width: 128, height: "auto" }} />
      <div style={{ fontSize: 13, color: "#145281", fontWeight: 500, textAlign: "center", maxWidth: 300 }}>
        Votre clé d'accès à la faculté de médecine
      </div>
    </div>
  );
}

function LinkArrow({ children, onClick }) {
  return <span onClick={onClick} style={{ color: "#3B6BE8", fontWeight: 500, cursor: "pointer" }}>{children}</span>;
}

function LoginForm({ onSwitch }) {
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const submit = () => {
    if (!email || !pw) { setErr("Veuillez renseigner votre email et votre mot de passe."); return; }
    setErr(""); setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };
  return (
    <React.Fragment>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1D2E", margin: 0 }}>Bon retour</h1>
      <p style={{ fontSize: 14, color: "#8A92A6", margin: "8px 0 28px" }}>Connectez-vous à votre compte</p>
      {err && <div style={{ background: "#FEF2F2", border: "0.5px solid #FECACA", color: "#B91C1C", fontSize: 12, padding: "10px 12px", borderRadius: 10, marginBottom: 16 }}>{err}</div>}
      <Field label="Adresse email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.fr" error={err && !email ? " " : ""} />
      <Field label="Mot de passe" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"
        error={err && !pw ? " " : ""}
        trailing={<span onClick={() => setShow(s => !s)} style={{ cursor: "pointer", color: "#8A92A6", display: "flex" }}><Icon name={show ? "eye-off" : "eye"} size={18} /></span>} />
      <div style={{ textAlign: "right", marginTop: -6, marginBottom: 18 }}>
        <span style={{ fontSize: 12, color: "#3B6BE8", cursor: "pointer" }}>Mot de passe oublié ?</span>
      </div>
      <SubmitButton loading={loading} loadingLabel="Connexion..." onClick={submit}>Se connecter</SubmitButton>
      <Divider>ou continuer avec</Divider>
      <GoogleButton>Continuer avec Google</GoogleButton>
      <p style={{ fontSize: 13, color: "#8A92A6", textAlign: "center", marginTop: 28, marginBottom: 0 }}>
        Pas encore de compte ? <LinkArrow onClick={onSwitch}>S'inscrire →</LinkArrow>
      </p>
    </React.Fragment>
  );
}

function RegisterForm({ onSwitch }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const submit = () => {
    if (!name || !email || !pw) { setErr("Tous les champs sont requis pour créer un compte."); return; }
    setErr(""); setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };
  return (
    <React.Fragment>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1D2E", margin: 0 }}>Créer un compte</h1>
      <p style={{ fontSize: 14, color: "#8A92A6", margin: "8px 0 28px" }}>Rejoignez MedenPoche gratuitement</p>
      {err && <div style={{ background: "#FEF2F2", border: "0.5px solid #FECACA", color: "#B91C1C", fontSize: 12, padding: "10px 12px", borderRadius: 10, marginBottom: 16 }}>{err}</div>}
      <Field label="Nom complet" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Sara Lahlou" error={err && !name ? " " : ""} />
      <Field label="Adresse email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.fr" error={err && !email ? " " : ""} />
      <Field label="Mot de passe" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"
        error={err && !pw ? " " : ""}
        trailing={<span onClick={() => setShow(s => !s)} style={{ cursor: "pointer", color: "#8A92A6", display: "flex" }}><Icon name={show ? "eye-off" : "eye"} size={18} /></span>} />
      <StrengthBar pw={pw} />
      <SubmitButton loading={loading} loadingLabel="Création..." onClick={submit}>Créer mon compte</SubmitButton>
      <Divider>ou continuer avec</Divider>
      <GoogleButton>Continuer avec Google</GoogleButton>
      <p style={{ fontSize: 13, color: "#8A92A6", textAlign: "center", marginTop: 28, marginBottom: 0 }}>
        Déjà un compte ? <LinkArrow onClick={onSwitch}>Se connecter →</LinkArrow>
      </p>
    </React.Fragment>
  );
}

function AuthApp() {
  const [mode, setMode] = React.useState("login");
  const [anim, setAnim] = React.useState(false);
  const switchTo = (m) => {
    setAnim(true);
    setTimeout(() => { setMode(m); setAnim(false); }, 160);
  };
  return (
    <div className="auth-shell" style={{ display: "flex", minHeight: "100vh", background: "#fff", fontFamily: "var(--font-sans)" }}>
      <LeftPanel />
      <div className="auth-right" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#fff" }}>
        <MobileLogo />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "48px 24px" }}>
          <div style={{
            width: "100%", maxWidth: 380,
            opacity: anim ? 0 : 1, transform: anim ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 160ms ease, transform 160ms ease",
          }}>
            {mode === "login"
              ? <LoginForm onSwitch={() => switchTo("register")} />
              : <RegisterForm onSwitch={() => switchTo("login")} />}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes mpspin { to { transform: rotate(360deg); } }
        .mp-spin { animation: mpspin 700ms linear infinite; }
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AuthApp />);
