import React from 'react';

interface HeaderProps {
  siteName: string;
  websiteUrl?: string;
  floorplansUrl?: string;
  currentPage?: 'home' | 'floorplans' | 'amenities';
}

export function Header({
  siteName,
  websiteUrl = '/',
  floorplansUrl,
  currentPage,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-container">
        <a href={websiteUrl} className="header-logo">
          {siteName}
        </a>
        <nav className="header-nav">
          <a
            href={websiteUrl}
            className={currentPage === 'home' ? 'active' : ''}
          >
            Home
          </a>
          <a
            href={websiteUrl + '/amenities'}
            className={currentPage === 'amenities' ? 'active' : ''}
          >
            Amenities
          </a>
          {floorplansUrl && (
            <a
              href={floorplansUrl}
              className={currentPage === 'floorplans' ? 'active' : ''}
            >
              Floorplans
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

