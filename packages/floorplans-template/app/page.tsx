interface Floorplan {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft: number;
}

// Default mock data for development
const mockFloorplans: Floorplan[] = [
  { id: '1', name: '1 Bedroom Classic', beds: 1, baths: 1, sqft: 750 },
  { id: '2', name: '2 Bedroom Modern', beds: 2, baths: 2, sqft: 1100 },
  { id: '3', name: '3 Bedroom Deluxe', beds: 3, baths: 2, sqft: 1450 },
];

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
  const floorplans = getFloorplans();

  return (
    <main>
      <nav className="breadcrumb">
        <a href={websiteUrl}>← Back to {siteName}</a>
      </nav>

      <h1>Available Floorplans</h1>
      <p>Choose from our selection of thoughtfully designed floor plans.</p>

      <div className="floorplans-grid">
        {floorplans.map((fp) => (
          <div key={fp.id} className="floorplan-card">
            <h2>{fp.name}</h2>
            <div className="floorplan-details">
              <span>{fp.beds} Bed</span>
              <span>{fp.baths} Bath</span>
              <span>{fp.sqft} sq ft</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
