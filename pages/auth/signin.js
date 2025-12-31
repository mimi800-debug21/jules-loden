import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation - in a real app you'd have proper authentication
    if (username === 'admin' && password === 'admin123') {
      // Redirect to admin page
      window.location.href = '/admin';
    } else {
      setError('Ungültige Anmeldedaten');
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Admin Login - Jules Loden</title>
        <meta name="description" content="Admin login for Jules Loden" />
      </Head>

      <header>
        <div className="brand">
          <div className="brand-badge"></div>
          <div>
            <div className="brand-subtitle">Admin-Bereich</div>
            <div className="brand-title">Jules Loden</div>
          </div>
        </div>
        <nav>
          <Link href="/" className="btn">Home</Link>
        </nav>
      </header>

      <main>
        <div className="panel" style={{ maxWidth: '400px', margin: '50px auto' }}>
          <h2>Admin Login</h2>

          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Benutzername</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Passwort</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="actions">
              <button type="submit" className="btn primary">Anmelden</button>
              <Link href="/" className="btn">Zurück</Link>
            </div>
          </form>
        </div>
      </main>

      <footer className="footer">
        © 2025 Jules Loden • Bestellsystem • Sichere Zahlung • Made with ❤️
      </footer>
    </div>
  );
}