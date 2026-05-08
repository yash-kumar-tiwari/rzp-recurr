import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/providers/StoreProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'SubscriptionHub — Manage Your Subscriptions',
  description:
    'A modern SaaS subscription management platform powered by Razorpay. Subscribe, upgrade, and manage your plan seamlessly.',
  keywords: 'subscription, razorpay, saas, billing, payment',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <StoreProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
