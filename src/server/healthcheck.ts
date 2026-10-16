// Docker HEALTHCHECK: works for plain HTTP and for the optional TLS mode.
const port = process.env.PORT ?? '7777';
const scheme = process.env.TLS_CERT_FILE ? 'https' : 'http';
try {
  const res = await fetch(`${scheme}://127.0.0.1:${port}/api/health`, { tls: { rejectUnauthorized: false } });
  process.exit(res.ok ? 0 : 1);
} catch {
  process.exit(1);
}

export {};
