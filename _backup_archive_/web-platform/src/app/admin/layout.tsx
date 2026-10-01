export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--e-surface-raised)] text-[var(--e-text-primary)]">
      <main className="e-main">{children}</main>
    </div>
  );
}
