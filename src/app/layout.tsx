import "./globals.css";
import type { Metadata, Viewport } from "next";
import { getMe } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  applicationName: BRAND.name,
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  const theme = (me?.theme ?? "dark") as "dark" | "light" | "system";
  const domTheme = theme === "system" ? "dark" : theme;

  return (
    <html lang="en" data-theme={domTheme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers initialUser={me} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
