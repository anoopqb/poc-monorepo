import { Header } from '@repo/shared/components';

export default function Home() {
  const siteName = process.env.SITE_NAME || 'Property Website';
  const floorplansUrl = process.env.FLOORPLANS_URL || '/floorplans';
  const basePath = process.env.SITE_BASE_PATH || '';

  return (
    <>
      <Header
        siteName={siteName}
        websiteUrl={basePath || '/'}
        floorplansUrl={floorplansUrl}
        currentPage="home"
      />
      <main>
        <h1>Welcome to {siteName}</h1>
        <p>Your dream home awaits.</p>
        <a href={floorplansUrl} className="cta-link">
          View Available Floorplans →
        </a>
      </main>
    </>
  );
}
