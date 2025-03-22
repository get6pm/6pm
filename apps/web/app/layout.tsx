import { Inconsolata, Quicksand, Playfair_Display } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Metadata } from 'next'
import config from '@/constants/config'
import { ClerkProvider } from '@clerk/nextjs'
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
          className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} bg-background font-sans antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
