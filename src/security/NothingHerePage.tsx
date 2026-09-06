/**
 * Page morte hors embed Grist (prod) : pas de nav, pas d’Alert métier.
 * Obscurcissement UX — le JS reste téléchargeable (voir SECURITY.md).
 */
export function NothingHerePage() {
  return (
    <main
      style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#666",
        fontSize: "1rem",
      }}
    >
      <p style={{ margin: 0 }}>Rien à afficher.</p>
    </main>
  );
}
