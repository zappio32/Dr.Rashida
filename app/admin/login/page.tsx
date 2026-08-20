import { LoginForm } from '@/components/login-form';
export default function AdminLoginPage() { return <main className="auth"><LoginForm title="Admin sign in" redirect="/admin/dashboard" expectedRole="ADMIN" /></main>; }
