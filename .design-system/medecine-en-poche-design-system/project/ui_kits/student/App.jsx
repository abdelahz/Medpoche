/* global React, ReactDOM, IOSDevice, BottomNav, HomeScreen, PracticeScreen, AiScreen, ProgressScreen, LibraryScreen */
// Student app shell — phone frame + bottom-nav routing + full-screen practice flow.

function StudentApp() {
  const [tab, setTab] = React.useState("home");
  const [practicing, setPracticing] = React.useState(false);

  let screen;
  if (tab === "home") screen = <HomeScreen onStartPractice={() => setPracticing(true)} />;
  else if (tab === "library") screen = <LibraryScreen />;
  else if (tab === "ai") screen = <AiScreen />;
  else if (tab === "progress") screen = <ProgressScreen />;
  else screen = <HomeScreen onStartPractice={() => setPracticing(true)} />;

  const goPractice = () => { setTab("practice"); setPracticing(true); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EBEDF3", padding: 24, fontFamily: "var(--font-sans)" }}>
      <IOSDevice>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
          {practicing ? (
            <PracticeScreen onExit={() => { setPracticing(false); if (tab === "practice") setTab("home"); }} />
          ) : (
            <React.Fragment>
              <div style={{ flex: 1, overflow: "auto" }}>{screen}</div>
              <BottomNav current={tab} onNavigate={(id) => { if (id === "practice") goPractice(); else setTab(id); }} />
              <div style={{ height: 20, background: "#fff", flexShrink: 0 }} />
            </React.Fragment>
          )}
        </div>
      </IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<StudentApp />);
