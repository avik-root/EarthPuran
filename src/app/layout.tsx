
"use client"; // Required because usePathname is a client hook

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductChatbot } from '@/components/ProductChatbot';
import { usePathname } from 'next/navigation'; // Import usePathname

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata can remain static if you don't need it to change based on route
// export const metadata: Metadata = {
// title: 'Earth Puran - Natural & Organic Products',
// description: 'Discover the purity of nature with Earth Puran. Shop high-quality, natural, and organic beauty products exclusively from Earth Puran.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Default metadata can be placed here if not using the export const metadata */}
        <title>Earth Puran - Natural & Organic Products</title>
        <meta name="description" content="Discover the purity of nature with Earth Puran. Shop high-quality, natural, and organic beauty products exclusively from Earth Puran." />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers>
          {!isAdminRoute && <Header />}
          <main className={isAdminRoute ? "flex-grow" : "flex-grow container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
            {children}
          </main>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <ProductChatbot />}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
