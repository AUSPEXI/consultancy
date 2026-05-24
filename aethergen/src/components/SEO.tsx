import React, { useEffect } from 'react';

type SEOProps = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}='${key}']`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const SEO: React.FC<SEOProps> = ({ title, description, canonical, ogImage = '/og-image.svg?v=2', jsonLd }) => {
  useEffect(() => {
    if (title) document.title = title;
    upsertMeta('name', 'description', description);
    if (canonical) {
      let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
    // Open Graph
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', ogImage);
    // Twitter
    upsertMeta('property', 'twitter:card', 'summary_large_image');
    upsertMeta('property', 'twitter:title', title);
    upsertMeta('property', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    // JSON-LD
    const existing = document.querySelectorAll('script[data-seo-jsonld]');
    existing.forEach((n) => n.parentElement?.removeChild(n));
    if (jsonLd) {
      const scripts = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      scripts.forEach((obj) => {
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.setAttribute('data-seo-jsonld', '1');
        s.innerHTML = JSON.stringify(obj);
        document.head.appendChild(s);
      });
    }
  }, [title, description, canonical, ogImage, JSON.stringify(jsonLd)]);

  return null;
};

export default SEO;


