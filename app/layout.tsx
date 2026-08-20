import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dr. Rashida Ahmad | Ayurvedic Consultation', description: 'Online and clinic Ayurvedic consultations with Dr. Rashida Ahmad.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
