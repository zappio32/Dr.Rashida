'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="auth"><div className="auth-card"><div className="eyebrow">Temporarily unavailable</div><h1 style={{ fontSize: 42, margin: '12px 0' }}>We could not load this page.</h1><p className="muted">The application is running, but a required server service is unavailable. Please try again shortly.</p><div className="actions" style={{ marginTop: 22 }}><button className="btn primary" onClick={() => reset()}>Try again</button><a className="btn quiet" href="/">Return home</a></div></div></main>;
}
