import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Chat Demo',
  description: 'Demo UI for the AI Chat API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
