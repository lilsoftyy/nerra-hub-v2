import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nerra — Kvalifisering',
  description: 'Kvalifiseringsskjema for Nerra-kunder',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
