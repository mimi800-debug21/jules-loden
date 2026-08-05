import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { WaveIcon } from '../components/Icons';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/client'), 900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="splash">
      <Head>
        <title>Restaurant am See — Bestellsystem</title>
        <meta name="description" content="Restaurant am See — Ihr Bestellsystem" />
      </Head>
      <div className="splash-badge">
        <WaveIcon size={40} />
      </div>
      <h1 className="splash-title">Restaurant am See</h1>
      <p className="splash-sub">Ihre Bestellung beginnt gleich…</p>
    </div>
  );
}
