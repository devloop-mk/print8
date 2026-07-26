import { CustomizerViewport } from '@/components/products/customizer/CustomizerViewport';

export default function ProductCustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomizerViewport>
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </CustomizerViewport>
  );
}
