import React from 'react';
import { merchantProducts } from '../services/commerce';

// Sample memorial inscriptions, shown on the memorial plaques page (CategoryLanding) as starting points.
export const memorialInscriptions = [
  { title: 'A short remembrance', lines: ['In loving memory of', 'Peter Ward', '1950–2024', 'Always in our hearts'] },
  { title: 'A family tribute', lines: ['Remembering', 'Jamie Taylor', 'A much-loved partner, parent and friend', 'Your kindness stays with us'] },
  { title: 'A favourite place', lines: ['For Sam', 'Who found peace in this garden', 'And joy in sharing it'] },
];

export function MemorialMaterialLinks() {
  const brass = merchantProducts.find(item => item.slug === 'brushed-brass-210x148-rect-plaque')!;
  return (
    <p className="memorial-material-links">
      Compare <a href="/brass-plaques">brass plaque finishes</a> and <a href="/stainless-steel-plaques">stainless steel plaque finishes</a>, or view the <a href={`/${brass.slug}`}>A5 brushed brass plaque ({brass.startingFrom})</a>.
    </p>
  );
}
