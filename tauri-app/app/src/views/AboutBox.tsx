// Matches the legacy KaraLeah "About" dialog (vb/karaleah.frm):
// italic-serif title, bold MS Sans Serif body, light grey panel. Title and
// project name swapped to "OG Radio Cartographer" per the reference guide;
// the 2000s VB6 typography is intentionally preserved.
export function AboutBox() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '32px 16px',
        fontFamily: '"MS Sans Serif", Tahoma, "Segoe UI", sans-serif',
        color: '#000',
      }}
    >
      <div
        style={{
          background: '#f0f0f0',
          border: '1px solid #808080',
          boxShadow: 'inset 1px 1px 0 #ffffff, 2px 2px 4px rgba(0,0,0,0.25)',
          padding: '32px 64px 20px',
          textAlign: 'center',
          minWidth: 420,
        }}
      >
        <div
          style={{
            fontFamily: '"Times New Roman", "Georgia", serif',
            fontStyle: 'italic',
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          OG Radio Cartographer
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>Copyright 2026</div>

        <div style={{ marginTop: 22, fontSize: 13 }}>Created By</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700 }}>
          Daniel E. Reichart
        </div>

        <div style={{ marginTop: 18, fontSize: 13 }}>For</div>
        <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>
          Educational Research In Radio Astronomy
        </div>

        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700 }}>
          National Radio Astronomy Observatory
        </div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          Green Bank, West Virginia
        </div>
      </div>
    </div>
  );
}
