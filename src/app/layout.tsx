import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import 'lenis/dist/lenis.css';
import './globals.css';

// the name and numbers: Zodiak, a sharp display serif; text: Switzer. Both from Fontshare (ITF Free Font
// Licence), served from the site itself.
const zodiak = localFont({
  src: [{ path: '../fonts/zodiak-300.woff2', weight: '300' }, { path: '../fonts/zodiak-400.woff2', weight: '400' }],
  variable: '--font-serif',
  display: 'swap',
});
const switzer = localFont({
  src: [{ path: '../fonts/switzer-400.woff2', weight: '400' }, { path: '../fonts/switzer-500.woff2', weight: '500' }],
  variable: '--font-sans',
  display: 'swap',
});

const title = 'Fifty-Five · Reformer Pilates, Thong Lo, Bangkok';
const description = 'Reformer Pilates on Sukhumvit 55, Bangkok. Eight beds to a room, classes from 07:00, booked online. Six minutes from BTS Thong Lo.';
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website', siteName: 'Fifty-Five', locale: 'en_GB' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  themeColor: '#eee6d6',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${zodiak.variable} ${switzer.variable}`}>
      <body>{children}</body>
    </html>
  );
}
