export const metadata = {
  title: "מונדיאל 2026 — ניתוח חי",
  description: "סיכויי זכייה והמלצות הימורים בזמן אמת"
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: "#0a1628" }}>{children}</body>
    </html>
  );
}
