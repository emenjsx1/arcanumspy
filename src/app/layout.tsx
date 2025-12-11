import type { Metadata, Viewport } from "next"
import { Montserrat } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { LocaleProvider } from "@/contexts/locale-context"
import { LocaleWrapper } from "@/components/locale-wrapper"
import { SWRProvider } from "@/components/providers/swr-provider"
import { ViewportFix } from "@/components/viewport-fix"
import "./globals.css"

const montserrat = Montserrat({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  fallback: ["system-ui", "arial"]
})

export const metadata: Metadata = {
  title: "ArcanumSpy - Biblioteca de Ofertas Direct Response",
  description: "A maior biblioteca de ofertas de Direct Response do mercado. Nutra, PLR, E-com, BizOpp, Finance e muito mais.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={montserrat.className} suppressHydrationWarning>
        <ViewportFix />
        <SWRProvider>
          <LocaleProvider>
            <LocaleWrapper>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </LocaleWrapper>
          </LocaleProvider>
        </SWRProvider>
      </body>
    </html>
  )
}

