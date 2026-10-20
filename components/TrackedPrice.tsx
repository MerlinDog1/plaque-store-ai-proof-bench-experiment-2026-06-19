import React, { useEffect, useRef } from 'react';
import { trackSiteEvent } from '../services/posthogAnalytics';
import { OPTIONAL_AD_CONSENT_CHANGED } from '../services/metaPixel';

// Some collections have a schema-only fallback price while displaying "quote
// checked before order". Only measure an amount the customer can actually see.
export function displayedPriceValue(label: string): number | undefined {
  const amount = label.match(/£(\d[\d,]*(?:\.\d{1,2})?)/)?.[1];
  return amount ? Number(amount.replace(/,/g, '')) : undefined;
}

export function TrackedPrice({ value, product, context = 'starting', children }: {
  value?: number;
  product?: string;
  context?: 'starting' | 'configured';
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !value || value <= 0 || !Number.isFinite(value) || !('IntersectionObserver' in window)) return;
    let visible = false;
    const track = () => {
      if (!visible) return;
      trackSiteEvent('price_viewed', {
        value_gbp: value, price_context: context, ...(product ? { product } : {}),
      }, `price:${window.location.pathname}:${context}`);
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5);
      track();
    }, { threshold: 0.5 });
    observer.observe(ref.current);
    window.addEventListener(OPTIONAL_AD_CONSENT_CHANGED, track);
    return () => {
      observer.disconnect();
      window.removeEventListener(OPTIONAL_AD_CONSENT_CHANGED, track);
    };
  }, [value, product, context]);
  return <span ref={ref}>{children}</span>;
}
