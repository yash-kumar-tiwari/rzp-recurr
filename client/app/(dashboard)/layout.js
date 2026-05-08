import Navbar from '@/components/shared/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30">
        © 2025 SubscriptionHub · Powered by Razorpay
      </footer>
    </div>
  );
}
