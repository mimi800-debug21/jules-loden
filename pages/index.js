import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { WaveIcon } from '../components/Icons';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/client'), 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="splash">
      <Head>
        <title>Restaurant am Teich</title>
        <meta name="description" content="Restaurant am Teich am Tegernsee — mittagskarte online." />
      </Head>
      <span className="splash-badge" aria-hidden="true">
        <WaveIcon size={42} />
      </span>
      <h1 className="splash-title">Restaurant am Teich</h1>
      <p className="splash-sub">Am Tegernsee · Küche bis 14:30 Uhr</p>
      <p className="splash-redirect">
        Öffnet gleich&nbsp;
        <a href="#" onClick={(e) => { e.preventDefault(); router.replace('/client'); }}>
          direkt zur Speisekarte
        </a>
      </p>
    </div>
  );
}
