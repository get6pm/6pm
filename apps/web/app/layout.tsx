import { Providers } from '@/components/providers'
import config from '@/constants/config'
import { Toaster } from '@6pm/ui/components/sonner'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { Inconsolata, Playfair_Display } from 'next/font/google'
import localFont from 'next/font/local'
import '@6pm/ui/globals.css'

const fontSans = localFont({
  src: [
    {
      path: '../public/fonts/AirbnbCereal-Book.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/AirbnbCereal-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/AirbnbCereal-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/AirbnbCereal-Light.ttf',
      weight: '300',
      style: 'normal',
    },
  ],
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
          className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} bg-background`}
        >
          <NextIntlClientProvider>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
