import './customizer-fonts.css';

const CUSTOMIZER_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Montserrat:wght@500;600;700;800&family=Oswald:wght@500;600;700&family=Playfair+Display:wght@600;700;800&family=Lora:wght@500;600;700&family=Merriweather:wght@400;700;900&display=swap';

export default function CustomizeProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link href={CUSTOMIZER_FONTS_HREF} rel="stylesheet" />
      <div className="customizer-font-scope">{children}</div>
    </>
  );
}
