import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ErrorProvider, ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToastContainer } from '@/components/error/ToastContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Connect Four | Play Online',
  description: 'A modern Connect Four game with AI opponents, game history, and offline play. Challenge yourself with three difficulty levels!',
  keywords: ['Connect Four', 'AI Game', 'Strategy Game', 'Online Game', 'Puzzle Game'],
  authors: [{ name: 'Connect Four Game' }],
  creator: 'Connect Four Game',
  publisher: 'Connect Four Game',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'),
  openGraph: {
    title: 'Connect Four | Play Online',
    description: 'Challenge yourself with AI opponents in this modern Connect Four game. Play offline, track your progress, and master the strategy!',
    url: '/',
    siteName: 'Connect Four',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Connect Four Game Board',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect Four | Play Online',
    description: 'Challenge yourself with AI opponents in this modern Connect Four game.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Connect Four" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Connect Four" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* PWA Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
      </head>

      <body className={`${inter.className} antialiased`}>
        <ErrorProvider>
          <ThemeProvider>
            <SettingsProvider>
              <ErrorBoundary context="Application">
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                  <div className="relative">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                      }}></div>
                    </div>

                    {/* Main content */}
                    <div className="relative">
                      {children}
                    </div>
                  </div>
                </div>
              </ErrorBoundary>
            </SettingsProvider>
          </ThemeProvider>

          {/* Toast notifications */}
          <ToastContainer position="top-right" maxToasts={5} />
        </ErrorProvider>
      </body>
    </html>
  );
}
