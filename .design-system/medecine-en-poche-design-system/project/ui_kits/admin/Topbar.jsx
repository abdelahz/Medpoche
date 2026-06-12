/* global React, Icon, Avatar, Button */
// Admin topbar — 56px, white, page title + actions.

function Topbar({ title, action }) {
  return (
    <header style={{
      height: 56, flexShrink: 0, background: "#fff",
      borderBottom: "0.5px solid var(--gray-200)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
    }}>
      <h1 style={{ fontSize: 17, fontWeight: 600, color: "var(--gray-900)", margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {action}
        <span style={{ color: "var(--gray-400)", display: "flex", cursor: "pointer" }}><Icon name="bell" size={20} /></span>
        <Avatar initials="LM" size={36} />
      </div>
    </header>
  );
}

Object.assign(window, { Topbar });
