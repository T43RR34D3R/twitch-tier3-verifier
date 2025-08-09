export default function ObsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{
        background: 'transparent',
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        {children}
      </body>
    </html>
  );
}
