import React from "react";

/**
 * React 19 supports <title>, <meta>, <link> tags rendered inside components.
 * React hoists them to <head> automatically.
 */
export default function Seo({
  title = "NK Prestige Steel Corporation — Premium Scrap Dealer in Karnataka",
  description = "Buy and sell scrap in Karnataka. Live scrap prices, doorstep pickup, GST invoicing. Ferrous, non-ferrous, electronic, and industrial scrap.",
  path = "/",
  image = "https://images.pexels.com/photos/36095234/pexels-photo-36095234.jpeg",
}) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="NK Prestige Steel Corporation" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#060B14" />
    </>
  );
}

export function LocalBusinessSchema({ info }) {
  if (!info) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": typeof window !== "undefined" ? window.location.origin : "",
    "name": info.business_name,
    "image": "https://images.pexels.com/photos/36095234/pexels-photo-36095234.jpeg",
    "url": typeof window !== "undefined" ? window.location.origin : "",
    "telephone": info.phone,
    "email": info.email,
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": info.office_address,
      "addressLocality": "Ramanagara",
      "addressRegion": "Karnataka",
      "postalCode": "562159",
      "addressCountry": "IN",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "12.7208",
      "longitude": "77.2839",
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "19:00",
      },
    ],
    "sameAs": [info.facebook, info.instagram, info.linkedin, info.twitter, info.youtube].filter(Boolean),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
