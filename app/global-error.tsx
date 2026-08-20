'use client';

export default function GlobalError() {
  return <html lang="en"><body><main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' }}><div><h1>We could not load the application.</h1><p>Please try again shortly.</p><a href="/">Return home</a></div></main></body></html>;
}
