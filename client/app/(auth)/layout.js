import { Zap } from 'lucide-react';

export const metadata = {
  title: 'Sign In — SubscriptionHub',
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Subscription<span className="text-primary">Hub</span>
          </span>
        </div>
      </header>

      {/* Auth form centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/30">
        © 2025 SubscriptionHub · Powered by Razorpay
      </footer>
    </div>
  );
}
