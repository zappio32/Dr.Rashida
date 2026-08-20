import Link from 'next/link';

export default function NotFound() {
  return <main className="auth"><div className="auth-card"><div className="eyebrow">Page not found</div><h1 style={{ fontSize: 42, margin: '12px 0' }}>We couldn&apos;t find that page.</h1><p className="muted">The page you are looking for does not exist or has moved.</p><div className="actions" style={{ marginTop: 22 }}><Link className="btn primary" href="/">Return home</Link></div></div></main>;
}
