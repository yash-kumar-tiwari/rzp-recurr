import { redirect } from 'next/navigation';

// Root page redirects to dashboard (middleware handles unauth → login)
export default function RootPage() {
  redirect('/dashboard');
}
