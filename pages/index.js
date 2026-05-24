import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Jules Loden</title>
        <meta name="description" content="Jules Loden Bestellsystem" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <div className="brand">
          <div className="brand-badge"></div>
          <div>
            <div className="brand-subtitle">Online Bestellsystem</div>
            <div className="brand-title">Jules Loden</div>
          </div>
        </div>
        <nav>
          <Link href="/client" className="btn">Bestellen</Link>
          <Link href="/waiter" className="btn">Bedienung</Link>
        </nav>
      </header>

      <main>
        <h1>Willkommen bei Jules Loden</h1>
        <p>Das neue Bestellsystem für Jules Loden</p>

        <div className="actions">
          <Link href="/client" className="btn primary">Zum Bestellbereich</Link>
        </div>
      </main>

      <footer className="footer">
        © 2025 Jules Loden • Bestellsystem • Sichere Zahlung • Made with ❤️
      </footer>
    </div>
  );
}