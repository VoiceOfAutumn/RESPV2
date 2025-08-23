/**
 * Utility functions for handling country flags
 */

/**
 * Returns the appropriate flag image URL for a given country
 * @param countryName - The name of the country
 * @param countryCode - The ISO country code (optional, used for regular countries)
 * @returns The URL to the flag image
 */
export function getFlagUrl(countryName: string, countryCode?: string): string {
  // Handle special custom countries
  if (countryName === 'Mushroom Kingdom') {
    return '/images/mkflag.png';
  }
  
  // For regular countries, use flagcdn.com
  if (countryCode) {
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  }
  
  // Fallback for countries without codes
  return '/images/default-flag.png'; // You could add a default flag image
}

/**
 * Component props for displaying a country with flag
 */
export interface CountryDisplayProps {
  countryName: string;
  countryCode?: string;
  className?: string;
  flagClassName?: string;
  textClassName?: string;
}

/**
 * Get the flag image element props for a country
 */
export function getFlagImageProps(countryName: string, countryCode?: string) {
  return {
    src: getFlagUrl(countryName, countryCode),
    alt: countryName,
    className: "w-6 h-4 object-cover rounded-sm",
    loading: "lazy" as const
  };
}