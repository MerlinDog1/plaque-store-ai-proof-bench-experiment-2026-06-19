import React from 'react';

/** The homepage's tagline (owner msg 5132), also on category pages that have no line of their own. */
export const homeTagline = <>Some words deserve to <em>stay.</em></>;

/** The homepage's first section, shared with the category pages (owner msg 10329, 6 Nov 2026: "we want to be matching
 * the text size and layout of the homepage always"): kicker, title, tagline, intro and the two buttons, the film
 * straight under the buttons on phones and beside the copy on computers, then the page's own notes (children). One
 * markup and one set of styles (shopfront.css .shop-hero), so a change to the homepage's hero changes theirs too. */
export function ShopHero({ className, crumbs, kicker, title, tagline, intro, choices, film, children }: {
  /** .cat-film-hero on the category pages: their breadcrumb and their own button glow (shopfront.css). */
  className?: string;
  /** A category page's breadcrumb, at the top of the copy. */
  crumbs?: React.ReactNode;
  kicker: React.ReactNode;
  title: React.ReactNode;
  tagline?: React.ReactNode;
  intro: React.ReactNode;
  choices: React.ReactNode;
  /** The page's film, rendered twice: under the buttons on phones, beside the copy on computers. CSS shows one, and the
   * hidden copy never loads its video. */
  film: (className: string) => React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className={className ? `shop-hero ${className}` : 'shop-hero'}>
      <div className="shop-hero-copy">
        {crumbs}
        <p className="shop-kicker">{kicker}</p>
        <h1 className="shop-hero-title">{title}</h1>
        {tagline && <p className="shop-hero-tagline">{tagline}</p>}
        <p className="shop-intro">{intro}</p>
        <div className="shop-hero-choices">{choices}</div>
        {film('shop-hero-film-inline')}
        {children}
      </div>
      {film('shop-hero-film-side')}
    </section>
  );
}
