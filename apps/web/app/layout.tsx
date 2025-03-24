import { Providers } from '@/components/providers'
import config from '@/constants/config'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <body
          className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} bg-background font-medium font-sans antialiased [&_*]:cursor-default`}
        >
          <NextIntlClientProvider>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
