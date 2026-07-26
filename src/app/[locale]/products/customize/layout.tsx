export default function ProductCustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] min-h-0 flex-col overflow-hidden">
      {children}
    </div>
  );
}
