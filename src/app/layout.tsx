"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navbar } from "@/components";
import { usePathname } from "next/navigation";
import Head from "next/head";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const defaultMetadata = {
  title: "Bravo Crud",
  description: "Site da bravo para a equipe da Casas Bahia",
  keywords: "Bravo, Casas Bahia, Fiscal",
  ogImage: "/images/og-image.jpg",
  url: "https://bravo-crud.vercel.app/",
};

function HtmlWithTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  // Garante que a classe 'dark' é aplicada dinamicamente no <html>
  if (typeof window !== "undefined") {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showNavbar = !["/login", "/cadastro"].includes(pathname || "");

  return (
    <html lang="pt-br" dir="ltr" suppressHydrationWarning>
      <Head>
        {/* Metatags essenciais */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* SEO Básico */}
        <title>{defaultMetadata.title}</title>
        <meta name="description" content={defaultMetadata.description} />
        <meta name="keywords" content={defaultMetadata.keywords} />
        
        {/* Open Graph / Social Media */}
        <meta property="og:title" content={defaultMetadata.title} />
        <meta property="og:description" content={defaultMetadata.description} />
        <meta property="og:image" content={defaultMetadata.ogImage} />
        <meta property="og:url" content={defaultMetadata.url} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={defaultMetadata.title} />
        <meta name="twitter:description" content={defaultMetadata.description} />
        <meta name="twitter:image" content={defaultMetadata.ogImage} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preload de fontes para melhor performance */}
        <link
          rel="preload"
          href="/fonts/your-font.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <HtmlWithTheme>
            <ToastContainer 
              role="alert"
              aria-live="assertive"
              toastClassName="sr-only"
            />
            {showNavbar && <Navbar />}
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <ThemeToggleButton />
          </HtmlWithTheme>
        </ThemeProvider>
      </body>
    </html>
  );
}