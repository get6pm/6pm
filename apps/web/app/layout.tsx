import { Providers } from '@/components/providers'
import config from '@/constants/config'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inconsolata, Playfair_Display, Quicksand } from 'next/font/google'
import '@6pm/ui/globals.css'

const fontSans = Quicksand({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = Inconsolata({
  subsets: ['latin'],
  variable: '--font-mono',
})

const fontSerif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: `${config.appNameLowercase} – Finance Intelligence`,
  description: 'Financial management for the modern age',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} bg-background font-medium font-sans antialiased [&_*]:cursor-default`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
