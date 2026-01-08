import { Header } from '@repo/shared/components';

interface Floorplan {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  availableDate: string | null;
}

// Default mock data for development
const mockFloorplans: Floorplan[] = [
  { id: '1', name: '1 Bedroom Classic', beds: 1, baths: 1, sqft: 750, price: 1850, availableDate: null },
  { id: '2', name: '2 Bedroom Modern', beds: 2, baths: 2, sqft: 1100, price: 2450, availableDate: '2026-02-15' },
  { id: '3', name: '3 Bedroom Deluxe', beds: 3, baths: 2, sqft: 1450, price: 3200, availableDate: '2026-03-01' },
];

// Format price as currency
function formatPrice(price: number): string {
  return `$${price.toLocaleString()}/mo`;
}

// Format availability date
function formatAvailability(availableDate: string | null): { text: string; isNow: boolean } {
  if (!availableDate) {
    return { text: 'Available Now', isNow: true };
  }
  
  const date = new Date(availableDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  return { text: `Available ${month}/${day}/${year}`, isNow: false };
}

// Read floorplans from env (set at build time from JSON file)
function getFloorplans(): Floorplan[] {
  const data = process.env.FLOORPLANS_DATA;
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      console.warn('Failed to parse FLOORPLANS_DATA');
    }
  }
  // Fallback to mock data for development
  return mockFloorplans;
}

export default function FloorplansPage() {
  const siteName = process.env.SITE_NAME || 'Property';
  const websiteUrl = process.env.WEBSITE_URL || '/';
  const basePath = process.env.SITE_BASE_PATH || '';
  const floorplans = getFloorplans();

  return (
    <>
      <Header
        siteName={siteName}
        websiteUrl={websiteUrl}
        floorplansUrl={basePath ? `${basePath}/floorplans` : '/floorplans'}
        currentPage="floorplans"
      />
      <main>
        <h1>Available Floorplans</h1>
        <p>Choose from our selection of thoughtfully designed floor plans.</p>

        <div className="floorplans-grid">
          {floorplans.map((fp) => {
            const availability = formatAvailability(fp.availableDate);
            return (
              <div key={fp.id} className="floorplan-card">
                <h2>{fp.name}</h2>
                <div className="floorplan-price">{formatPrice(fp.price)}</div>
                <div className="floorplan-details">
                  <span>{fp.beds} Bed</span>
                  <span>{fp.baths} Bath</span>
                  <span>{fp.sqft} sq ft</span>
                </div>
                <div className={`floorplan-availability ${availability.isNow ? 'available-now' : 'available-later'}`}>
                  <span className="availability-dot">●</span>
                  {availability.text}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
