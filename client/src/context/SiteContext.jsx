"use client";

import { createContext, useContext } from "react";

const SiteContext = createContext(null);

/**
 * Provides site data (name, logo, contact info) to all client components.
 * Wrap the app tree with this in the root layout.
 */
export function SiteProvider({ children, siteData }) {
  const data = siteData || {
    name: "TaskGo Agency",
    logo: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
  };

  return (
    <SiteContext.Provider value={data}>
      {children}
    </SiteContext.Provider>
  );
}

/**
 * Hook to access site data in any client component.
 * Returns { name, logo, contactEmail, contactPhone, address, ... }
 */
export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    // Fallback if used outside provider (shouldn't happen)
    return { name: "TaskGo Agency", logo: null };
  }
  return ctx;
}

export default SiteContext;
