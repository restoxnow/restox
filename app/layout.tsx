import type { Metadata } from 'next'
import { Sora, Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Restox — Automate the Everyday',
  description:
    'Cross-retailer repeat purchase automation. One dashboard for Amazon, Walmart, groceries, and more. Set it once. Never run out again.',
  metadataBase: new URL('https://restox.net'),
  openGraph: {
    title: 'Restox — Automate the Everyday',
    description:
      'Cross-retailer repeat purchase automation. One dashboard for Amazon, Walmart, groceries, and more.',
    url: 'https://restox.net',
    siteName: 'Restox',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Restox — Automate the Everyday',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restox — Automate the Everyday',
    description:
      'Cross-retailer repeat purchase automation. One dashboard for Amazon, Walmart, groceries, and more.',
    site: '@restoxnow',
    creator: '@restoxnow',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'ekqg-8f2d78suiCmSdP2b4i4Nnj44gM5Ie-Ktphozuk',
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
  icons: {
    icon: [
      { url: '/favicon.ico',        sizes: 'any' },
      { url: '/favicon-16x16.png',  sizes: '16x16',  type: 'image/png' },
      { url: '/favicon-32x32.png',  sizes: '32x32',  type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5385038600205472" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
