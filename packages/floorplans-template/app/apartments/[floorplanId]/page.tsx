import { Header } from "@repo/shared/components";
import { UnitsContent } from "../UnitsContent";

interface Floorplan {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  availableDate: string | null;
}

// Get all floorplan IDs from the JSON data
function getAllFloorplanIds(): string[] {
  const data = process.env.FLOORPLANS_DATA;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const ids = new Set<string>();

      if (Array.isArray(parsed)) {
        parsed.forEach((fp: Floorplan) => {
          if (fp?.id) ids.add(String(fp.id));
        });
      } else if (parsed && typeof parsed === "object") {
        // Support full data shape keyed by site ID
        Object.values(parsed).forEach((property: any) => {
          if (property?.floorplans && Array.isArray(property.floorplans)) {
            property.floorplans.forEach((fp: Floorplan) => {
              if (fp?.id) ids.add(String(fp.id));
            });
          }
        });
      }

      return Array.from(ids);
    } catch {
      console.warn("Failed to parse FLOORPLANS_DATA");
    }
  }

  // Fallback to mock data IDs for development
  return ["4389897", "4389902", "4389896"];
}

// Generate static params for all floorplan IDs
export const dynamicParams = false;

export async function generateStaticParams() {
  const floorplanIds = getAllFloorplanIds();

  return floorplanIds.map((id) => ({
    floorplanId: id,
  }));
}

async function fetchUnitsHtml(
  floorplanId: string,
  unitsSiteId: string
): Promise<string> {
  const unitsBaseUrl =
    "https://bozzuto-floorplans-dev.s3.us-east-1.amazonaws.com";
  const unitsUrl = `${unitsBaseUrl}/${unitsSiteId}/units.html?floorplan=${floorplanId}`;

  try {
    const response = await fetch(unitsUrl, {
      cache: "force-cache", // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch units: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error("Error fetching units HTML:", error);
    return `
      <div class="no-results">
        <h3>Unable to load apartments</h3>
        <p>Please try again later or contact support if the problem persists.</p>
      </div>
    `;
  }
}

function extractContentFromHtml(html: string): string {
  // Try to extract the modern-container or body content
  const modernContainerMatch = html.match(
    /<div[^>]*class="[^"]*modern-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/body>/i
  );
  if (modernContainerMatch) {
    return modernContainerMatch[1];
  }

  // Try to extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }

  // Fallback: return the full HTML
  return html;
}

interface ApartmentsPageProps {
  params: { floorplanId: string };
}

export default async function ApartmentsPage({ params }: ApartmentsPageProps) {
  const floorplanId = params.floorplanId;
  const siteName = process.env.SITE_NAME || "Property";
  const websiteUrl = process.env.WEBSITE_URL || "/";
  const basePath = process.env.SITE_BASE_PATH || "";
  const unitsSiteId =
    process.env.UNITS_SITE_ID || process.env.SITE_ID || "p1526057";
  const unitsBaseUrl =
    "https://bozzuto-floorplans-dev.s3.us-east-1.amazonaws.com";

  let htmlContent = "";
  let error = null;

  if (floorplanId) {
    try {
      const fullHtml = await fetchUnitsHtml(floorplanId, unitsSiteId);
      htmlContent = extractContentFromHtml(fullHtml);
    } catch (e: any) {
      error = e.message;
      htmlContent = `
        <div class="no-results">
          <h3>Unable to load apartments</h3>
          <p>${error}</p>
        </div>
      `;
    }
  } else {
    htmlContent = `
      <div class="no-results">
        <h3>No floorplan selected</h3>
        <p>Please select a floorplan to view available apartments.</p>
      </div>
    `;
  }

  return (
    <>
      <Header
        siteName={siteName}
        websiteUrl={websiteUrl}
        floorplansUrl={basePath ? `${basePath}/floorplans` : "/floorplans"}
        currentPage="floorplans"
      />
      <div className="modern-container">
        {floorplanId ? (
          <UnitsContent
            htmlContent={htmlContent}
            floorplanId={floorplanId}
            unitsBaseUrl={unitsBaseUrl}
          />
        ) : (
          <div className="no-results">
            <h3>No floorplan selected</h3>
            <p>Please select a floorplan to view available apartments.</p>
          </div>
        )}
      </div>
    </>
  );
}
