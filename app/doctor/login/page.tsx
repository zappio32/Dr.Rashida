import { LoginForm } from '@/components/login-form';
export default function DoctorLoginPage() { return <main className="auth"><LoginForm title="Doctor sign in" redirect="/doctor/dashboard" expectedRole="DOCTOR" /></main>; }
