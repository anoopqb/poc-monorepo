"use client";

import { useEffect } from "react";

interface UnitsContentProps {
  htmlContent: string;
  floorplanId: string;
  unitsBaseUrl: string;
}

export function UnitsContent({
  htmlContent,
  floorplanId,
  unitsBaseUrl,
}: UnitsContentProps) {
  useEffect(() => {
    // Load the apartment listing script for filtering functionality
    const script = document.createElement("script");
    script.src = `${unitsBaseUrl}/assets/apartment-listing.js`;
    script.async = true;

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="apartment-listing.js"]'
    );
    if (!existingScript) {
      document.body.appendChild(script);
    }

    // Filter by floorplan ID after content is rendered
    const filterByFloorplan = () => {
      const apartmentCards = document.querySelectorAll(".apartment-card");
      apartmentCards.forEach((card) => {
        const cardFloorplanId = card.getAttribute("data-floorplanid");
        if (cardFloorplanId === floorplanId) {
          (card as HTMLElement).style.display = "block";
        } else {
          (card as HTMLElement).style.display = "none";
        }
      });
    };

    script.onload = () => {
      filterByFloorplan();
    };

    // If script already loaded, filter immediately
    if (existingScript) {
      setTimeout(filterByFloorplan, 100);
      setTimeout(filterByFloorplan, 500);
    } else {
      // Wait a bit for content to render
      setTimeout(filterByFloorplan, 200);
      setTimeout(filterByFloorplan, 1000);
    }

    return () => {
      const scriptToRemove = document.querySelector(
        'script[src*="apartment-listing.js"]'
      );
      if (scriptToRemove && scriptToRemove !== existingScript) {
        scriptToRemove.remove();
      }
    };
  }, [htmlContent, floorplanId, unitsBaseUrl]);

  return (
    <div
      id="units-content"
      className="units-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

