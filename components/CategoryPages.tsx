import React from 'react';
import { merchantProducts, type ProductFamily } from '../services/commerce';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { ContactLink } from './ContactOptions';
import { MemorialMaterialLinks, memorialInscriptions } from './MemorialGuide';
import { SizeLinksFold, type ExampleItem, type LandingConfig } from './CategoryLanding';

// What each category page shows, on the layout of the memorial page (owner msg 5876) and brought up to its standard
// (msg 5927, 24 Oct 2026: "bring every other page up to that standard. Sense check each Pic and redo if dumb.
// Remember to use mixture of materials, borders, woods etc"). Each top photo shows the plaque its "from" price is
// for, and "Design online" opens on that plaque (the product presets in services/commerce.ts), so the price does not
// jump (owner msg 5906). Photos: scripts/publish-category-page-images.py and publish-memorial-page-images.py.

// Scale (owner msg 5959, 24 Oct: "Scale kinda f'd on this one" about the opening hero): the built-in preview draws a
// plaque about 2-3 times too big against bricks and doors. Heroes show the plaque against large or irregular surfaces
// (stone cladding, render) or with the brick count spelled out in the brief and checked by eye: an A5 plaque is one brick
// long and two courses tall, A4 one and a half bricks and three courses.
const memorial = '/site-images/memorial';
const category = '/site-images/category';
const photo = (slug: string) => `/site-images/catalogue-photo/${slug}-600.webp`;
const seeThis = (slug: string) => <a href={`/${slug}`}>See this plaque</a>;
const related = (content: React.ReactNode) => <p className="memorial-material-links cat-related">{content}</p>;
const brassMaterials = ['brushed-brass', 'polished-brass', 'orbital-brass-matt-lacquer', 'aged-brass'];
const priceOf = (slug: string) => merchantProducts.find(item => item.slug === slug)?.startingFrom || '';

export function categoryLandingFor(product: ProductFamily, subject: string, examples: ExampleItem[] = []): LandingConfig | undefined {
  const ask = (text: string) => <ContactLink channel="whatsapp" placement="page" subject={subject}>{text}</ContactLink>;
  switch (product.slug) {
    case 'memorial-plaques':
      return {
        prefix: 'memorial',
        title: 'Personalised memorial plaques',
        note: product.heroNote || 'Remember them in your own words.',
        hero: {
          // Real-looking photo from the plaque's own artwork (owner msgs 5992 and 6056); wall plaques like this one are
          // shown on wood with the scalloped border (msg 6001), so the caption names the board and its price.
          base: `${category}/memorial-hero-v4`,
          alt: 'Brushed stainless steel memorial plaque on a dark walnut board, reading In loving memory of Margaret Rowley, 1936 to 2023, Mum, Nan and dear friend, who loved this garden in every season, on an old brick garden wall beside a pink climbing rose',
          caption: <>Shown: A5 brushed stainless steel on a dark walnut board, {priceOf('brushed-stainless-210x148-rect-dark-wood-plaque')}. Without the board, it’s the plaque priced below. {seeThis('brushed-stainless-210x148-rect-dark-wood-plaque')}</>,
        },
        priceNote: 'A5 stainless steel, with engraving, fixings and UK delivery',
        // Four distinct settings (owner msg 5906); wall plaques are the hero and the picks below.
        routes: {
          kicker: 'Choose by setting',
          title: 'Where will it go?',
          routes: [
            { href: '/bench-plaques', title: 'On a bench', image: `${memorial}/route-bench.webp`, alt: 'Polished brass memorial plaque on a wooden bench, reading Peter John Wilson, please sit awhile, enjoy the view', priceSlug: 'bench-plaques' },
            { href: '/garden-plaques', title: 'In the garden', image: `${category}/route-garden-stone-v4.webp`, alt: 'Brushed brass memorial plaque for Ivy and Sid Moore, who made this garden together, fixed to a large garden boulder among lady’s mantle, catmint and roses', priceSlug: 'garden-plaques' },
            { href: '/tree-memorial-plaques', title: 'By a tree', image: `${memorial}/route-tree-v3.webp`, alt: 'Close-up of a brushed brass tree memorial plaque for Jim Partridge on an oak board and black ground stake beside a young cherry tree in blossom', priceSlug: 'tree-memorial-plaques' },
            { href: '/polished-brass-150x50-rect-plaque', title: 'At a grave', image: `${memorial}/route-grave-cross-v2.webp`, alt: 'Small polished brass name plate for Alice May Grant screwed to the arm of a temporary oak cross in a village churchyard, with white and yellow flowers', priceSlug: 'polished-brass-150x50-rect-plaque' },
          ],
          more: <>On a wall, in a church or somewhere else? {ask('Ask us on WhatsApp')} and we’ll suggest a size and fixings. For a grave, check the cemetery’s rules first.</>,
        },
        sizes: {
          title: 'Choose a size for your words.',
          intro: 'Measure the space first, then give the words room to breathe. Each plate is drawn to scale.',
          sizes: [
            { slug: 'bench-plaques', label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and dates, for a bench' },
            { slug: 'a5-brushed-steel-personalised-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A name, dates and a short tribute' },
            { slug: 'brushed-stainless-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A longer tribute or several names' },
            { slug: 'brushed-stainless-400x300-rect-plaque', label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A family memorial, a poem or a portrait' },
          ],
          note: <>Prices are for brushed stainless steel without wood backing, including engraving, fixings and UK delivery. Brass, other finishes and wood backing are priced in the designer. <a href="/plaque-sizes">See every size and price</a>.</>,
        },
        portraits: true,
        wording: {
          title: 'Memorial plaque wording ideas.',
          intro: 'Start with the name as you want it remembered, then dates if you wish and a few words of your own. These examples are starting points: change anything you like.',
          inscriptions: [...memorialInscriptions, { title: 'For a pet', lines: ['Bramble', '2011–2025', 'Our faithful friend,', 'forever by our side'] }],
        },
        related: <MemorialMaterialLinks />,
      };

    case 'bench-plaques':
      return {
        prefix: 'bench',
        title: 'Personalised bench plaques',
        note: 'A small place for a lasting memory.',
        hero: {
          base: `${category}/bench-hero-v4`,
          alt: 'Brushed stainless steel bench plaque reading In loving memory of George Holland, 1931 to 2021, screwed to the middle of the top rail of a new teak bench on a grassy hilltop',
          caption: <>Shown: brushed stainless steel, 150 × 50 mm, the plaque priced below. {seeThis('brushed-stainless-150x50-rect-plaque')}</>,
        },
        priceNote: '150 × 50 mm stainless steel, with engraving, screws and UK delivery',
        sizes: {
          title: 'Choose a size for the bench.',
          intro: 'Measure the flat part of the backrest first: most top rails take a plaque 50 to 75 mm tall. Each plate is drawn to scale.',
          sizes: [
            { slug: 'brushed-stainless-150x50-rect-plaque', label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a short line' },
            { slug: 'brushed-stainless-200x50-rect-plaque', label: '200 × 50 mm', widthMm: 200, heightMm: 50, fits: 'Two names, or a longer line' },
            { slug: 'brushed-stainless-150x75-rect-plaque', label: '150 × 75 mm', widthMm: 150, heightMm: 75, fits: 'A name, dates and a line' },
            { slug: 'brushed-stainless-225x75-rect-plaque', label: '225 × 75 mm', widthMm: 225, heightMm: 75, fits: 'A longer dedication' },
          ],
          note: <>Prices are for brushed stainless steel with screws, including engraving and UK delivery. Brass and polished finishes cost a little more.</>,
          more: <SizeLinksFold title="Every bench plaque size and finish" offers={merchantOffers.filter(offer => offer.format === 'Bench')} />,
        },
        wording: {
          title: 'Bench plaque wording ideas.',
          intro: 'A bench plaque has room for three to five short lines: a name, perhaps the years, and a sentence about them.',
          inscriptions: [
            { title: 'A short remembrance', lines: ['In loving memory of', 'Margaret Ellis', '1942–2024', 'Always in our hearts'] },
            { title: 'A favourite place', lines: ['For David', 'Who loved this view', 'And everyone who shared it'] },
            { title: 'An invitation', lines: ['Sit awhile with', 'Nancy Bell', '1941–2022'] },
            { title: 'Together', lines: ['In memory of', 'Ken & Val Ross', 'who walked here', 'every Sunday'] },
          ],
        },
        related: related(<>Remembering someone? See <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">memorial wording ideas</a>. For a garden or a memorial tree, see <a href="/garden-plaques">garden plaques</a> and <a href="/tree-memorial-plaques">memorial tree plaques</a>.</>),
      };

    case 'garden-plaques':
      return {
        prefix: 'garden',
        title: 'Personalised garden plaques',
        note: product.heroNote || 'A dedication for a favourite place.',
        hero: {
          // From a coded layout of the wall, so the plaque is level and true to size against the bricks (owner msgs
          // 5959, 6214), with the simpler wording (msgs 6189, 6229).
          base: `${category}/garden-hero-v3`,
          alt: 'Brushed stainless steel garden plaque with a scalloped border, reading In loving memory of Susan Marsh, 1951 to 2022, on an old red brick garden wall beside a climbing rose',
          caption: <>Shown: A5 brushed stainless steel, the plaque priced below. {seeThis('a5-brushed-steel-personalised-plaque')}</>,
        },
        priceNote: 'A5 stainless steel, with engraving, fixings and UK delivery',
        routes: {
          kicker: 'Choose by setting',
          title: 'Where in the garden?',
          routes: [
            { href: '/brushed-brass-200x150-rect-plaque', title: 'On a stone', image: `${category}/route-garden-stone-v4.webp`, alt: 'Brushed brass memorial plaque for Ivy and Sid Moore, who made this garden together, fixed to a large garden boulder among lady’s mantle, catmint and roses', priceSlug: 'brushed-brass-200x150-rect-plaque' },
            { href: '/orbital-brass-matt-lacquer-200x150-rect-plaque', title: 'On a fence', image: `${category}/route-garden-fence-v2.webp`, alt: 'Orbital brass pet memorial plaque reading In loving memory of Biscuit, 2006 to 2024, our gentle cat, on a weathered timber garden fence above lavender', priceSlug: 'orbital-brass-matt-lacquer-200x150-rect-plaque' },
            { href: '/tree-memorial-plaques', title: 'By a tree', image: `${memorial}/route-tree-v3.webp`, alt: 'Close-up of a brushed brass tree memorial plaque for Jim Partridge on an oak board and black ground stake beside a young cherry tree in blossom', priceSlug: 'tree-memorial-plaques' },
            { href: '/bench-plaques', title: 'On a bench', image: `${memorial}/route-bench.webp`, alt: 'Polished brass memorial plaque on a wooden bench, reading Peter John Wilson, please sit awhile, enjoy the view', priceSlug: 'bench-plaques' },
          ],
          more: <>On a wall, a gate or a shed? {ask('Ask us on WhatsApp')} and we’ll suggest a size and fixings.</>,
        },
        sizes: {
          title: 'Choose a size for the garden.',
          intro: 'Put the plaque where planting won’t cover it, then choose a size that gives the words room. Each plate is drawn to scale.',
          sizes: [
            { slug: 'bench-plaques', label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench or post' },
            { slug: 'brushed-stainless-200x150-rect-plaque', label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
            { slug: 'a5-brushed-steel-personalised-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A dedication and a short tribute' },
            { slug: 'brushed-stainless-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A shared garden or several names' },
          ],
          note: <>Prices are for brushed stainless steel without wood backing, including engraving, fixings and UK delivery. Metal on its own is made for outdoors. <a href="/plaque-sizes">See every size and price</a>.</>,
        },
        wording: {
          title: 'Garden plaque wording ideas.',
          intro: 'These are starting points, not customer commissions. Change the names and words, then check the fit in your proof.',
          inscriptions: [
            { title: 'A short dedication', lines: ['In memory of', 'Margaret Ellis', '1942–2024', 'Always happiest in the garden'] },
            { title: 'A family tribute', lines: ['In loving memory of', 'David Thompson', '1951–2023', 'We remember you here,', 'in the garden you loved'] },
            { title: 'A community garden', lines: ['This oak was planted', 'to celebrate fifty years', 'of our community garden', '1976–2026'] },
            { title: 'A garden of their own', lines: ['Grandad’s', 'Garden', 'Made with love, 2024'] },
          ],
        },
        guide: [
          ...(product.seoSections || []),
          { title: 'On a bench, wall or timber support', copy: 'Measure the flat fixing area, including any narrow bench slats. Keep holes away from joints and edges. Standard fixings are included; tell us what you are mounting to so the fixing arrangement can be checked. A wall or a separate timber support can give a tree dedication a clear place without fastening the plaque to the living tree.' },
          { title: 'At a shared garden or public bench', copy: 'Ask whoever manages the site for their permitted dimensions and mounting position before designing. Put the plaque where planting will not cover the inscription, and leave access for cleaning.' },
          { title: 'Looking after the finish', copy: 'Care depends on the selected finish. Check the care instructions before using polish or abrasive cleaners, especially on a sealed, aged or coated surface. Ask us about the intended location before ordering if it is particularly exposed or near the sea.' },
        ],
        related: related(<>Remembering someone? See <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">wording ideas</a>. Opening a community garden? See <a href="/opening-plaques">opening plaques</a>.</>),
      };

    case 'brass-plaques':
      return {
        prefix: 'brass',
        title: 'Personalised brass plaques',
        note: 'Warm, traditional and made to last.',
        hero: {
          // From a coded layout of the wall, with the plain wording (owner msgs 6189, 6270, 6281).
          base: `${category}/brass-hero-v3`,
          alt: 'Brushed brass memorial plaque with a scalloped border, reading In loving memory of Elsie Bond, 1925 to 2014, on an old honey-coloured Cotswold stone cottage wall',
          caption: <>Shown: A5 brushed brass, the plaque priced below. {seeThis('brushed-brass-210x148-rect-plaque')}</>,
        },
        priceNote: 'A5 brushed brass, with engraving, fixings and UK delivery',
        routes: {
          kicker: 'Four brass finishes',
          title: 'Choose your brass.',
          routes: [
            { href: '/brushed-brass-297x210-rect-dark-wood-plaque', title: 'Brushed brass', image: photo('brushed-brass-297x210-rect-dark-wood-plaque'), alt: 'A4 brushed brass memorial plaque for Frank and Joan Hollis on a dark walnut board, with a scalloped border, on an old red brick garden wall', priceSlug: 'brushed-brass-297x210-rect-dark-wood-plaque' },
            { href: '/polished-brass-200x150-rect-plaque', title: 'Polished brass', image: photo('polished-brass-200x150-rect-plaque'), alt: 'Polished brass house sign reading Holly House on a white-painted brick wall beside a green front door', priceSlug: 'polished-brass-200x150-rect-plaque' },
            { href: '/orbital-brass-matt-lacquer-297x210-rect-plaque', title: 'Orbital brass', image: photo('orbital-brass-matt-lacquer-297x210-rect-plaque'), alt: 'A4 orbital brass plaque on cedar boards, reading This pavilion was officially opened by Jean Harper MBE on 12 April 2025', priceSlug: 'orbital-brass-matt-lacquer-297x210-rect-plaque' },
            { href: '/aged-brass-210x148-rect-plaque', title: 'Aged brass', image: photo('aged-brass-210x148-rect-plaque'), alt: 'A5 aged brass memorial plaque for James Ormerod with cream lettering on a grey limestone wall', priceSlug: 'aged-brass-210x148-rect-plaque' },
          ],
          more: <>Not sure which? <a href="/materials">Compare the finishes</a>, or {ask('ask us on WhatsApp')}.</>,
        },
        sizes: {
          title: 'Choose a size for your words.',
          intro: 'Measure the space first, then give the words room to breathe. Each plate is drawn to scale.',
          sizes: [
            { slug: 'brushed-brass-150x50-rect-plaque', label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench' },
            { slug: 'brushed-brass-210x148-rect-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A house name or a short tribute' },
            { slug: 'brushed-brass-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'An opening or a longer tribute' },
            { slug: 'brushed-brass-400x300-rect-plaque', label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A dedication, a history or a portrait' },
          ],
          note: <>Prices are for brushed brass without wood backing, including engraving, fixings and UK delivery. Oak or dark wood backing is priced on each plaque.</>,
          more: <SizeLinksFold title="Every brass size and finish" offers={merchantOffers.filter(offer => brassMaterials.includes(offer.preset.material) && !offer.preset.wood)} />,
        },
        wording: {
          title: 'Brass plaque wording ideas.',
          intro: 'Brass suits memorials, house names, openings and thank-yous alike. Start with the most important line, then add the rest beneath it.',
          inscriptions: [
            { title: 'A house name', lines: ['Holly House'] },
            { title: 'A memorial', lines: ['In loving memory of', 'James Ormerod', '1941 – 2019'] },
            { title: 'An opening', lines: ['Officially opened by', 'Jean Harper MBE', 'on 12 April 2025'] },
            { title: 'A thank you', lines: ['Presented to', 'Linda Fairclough', 'with thanks for twenty years'] },
          ],
          link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
        },
        related: related(<>Compare with <a href="/stainless-steel-plaques">stainless steel plaques</a>, or see <a href="/memorial-plaques">memorial plaques</a>, <a href="/bench-plaques">bench plaques</a> and <a href="/opening-plaques">opening plaques</a>.</>),
      };

    case 'stainless-steel-plaques':
      return {
        prefix: 'stainless',
        title: 'Personalised stainless steel plaques',
        note: 'Clean, modern and made for outdoors.',
        hero: {
          // From a coded layout of the cladding: a house name, so the page is not all memorials (owner msg 6281).
          base: `${category}/stainless-hero-v2`,
          alt: 'Brushed stainless steel house sign reading The Old Dairy on black-stained timber cladding beside an oak door frame',
          caption: <>Shown: A5 brushed stainless steel, the plaque priced below. {seeThis('a5-brushed-steel-personalised-plaque')}</>,
        },
        priceNote: 'A5 stainless steel, with engraving, fixings and UK delivery',
        routes: {
          kicker: 'Finish and backing',
          title: 'Brushed, polished or on wood.',
          routes: [
            { href: '/brushed-stainless-250x150-oval-plaque', title: 'Brushed', image: photo('brushed-stainless-250x150-oval-plaque'), alt: 'Oval brushed stainless steel memorial plaque for Lilian Boyd on an old red brick garden wall', priceSlug: 'brushed-stainless-250x150-oval-plaque' },
            { href: '/polished-stainless-297x210-rect-plaque', title: 'Polished', image: photo('polished-stainless-297x210-rect-plaque'), alt: 'A4 polished stainless steel memorial plaque for Peter and June Walker on a stone garden wall, reflecting the sky', priceSlug: 'polished-stainless-297x210-rect-plaque' },
            { href: '/polished-stainless-200x150-rect-light-wood-plaque', title: 'On light oak', image: photo('polished-stainless-200x150-rect-light-wood-plaque'), alt: 'Polished stainless steel pet memorial plaque for Skye on a light oak board, on a blue-grey garden shed', priceSlug: 'polished-stainless-200x150-rect-light-wood-plaque' },
            { href: '/brushed-stainless-210x148-rect-dark-wood-plaque', title: 'On dark wood', image: photo('brushed-stainless-210x148-rect-dark-wood-plaque'), alt: 'Brushed stainless steel memorial plaque for Margaret Rowley on a dark walnut board, with a scalloped border', priceSlug: 'brushed-stainless-210x148-rect-dark-wood-plaque' },
          ],
          more: <>Wood backing suits indoors or a sheltered spot; metal on its own is made for outdoors. <a href="/materials">Compare the finishes</a>.</>,
        },
        sizes: {
          title: 'Choose a size for your words.',
          intro: 'Measure the space first, then give the words room to breathe. Each plate is drawn to scale.',
          sizes: [
            { slug: 'brushed-stainless-150x50-rect-plaque', label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench' },
            { slug: 'a5-brushed-steel-personalised-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A name, a welcome or a short tribute' },
            { slug: 'brushed-stainless-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'An opening or several names' },
            { slug: 'brushed-stainless-400x300-rect-plaque', label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A dedication, a history or a portrait' },
          ],
          note: <>Prices are for brushed stainless steel without wood backing, including engraving, fixings and UK delivery. Polished steel and wood backing are priced on each plaque.</>,
          more: <SizeLinksFold title="Every stainless steel size and finish" offers={merchantOffers.filter(offer => ['brushed-stainless', 'polished-stainless'].includes(offer.preset.material) && !offer.preset.wood)} />,
        },
        wording: {
          title: 'Stainless steel plaque wording ideas.',
          intro: 'Stainless steel suits memorials, community spaces, house names and thank-yous. Start with the most important line, then add the rest beneath it.',
          inscriptions: [
            { title: 'A house name', lines: ['The Old Dairy'] },
            { title: 'A memorial', lines: ['In loving memory of', 'Alan Vaughan', '1944 – 2021'] },
            { title: 'A bench', lines: ['In loving memory of', 'Tom & Betty Harris', 'Tom 1932 – 2016 · Betty 1935 – 2021', 'Together again'] },
            { title: 'A pet', lines: ['In loving memory of', 'Skye', '2010 – 2024', 'Our faithful friend'] },
          ],
          link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
        },
        related: related(<>Compare with <a href="/brass-plaques">brass plaques</a>, or see <a href="/memorial-plaques">memorial plaques</a>, <a href="/bench-plaques">bench plaques</a> and <a href="/opening-plaques">opening plaques</a>.</>),
      };

    case 'tree-memorial-plaques':
      return {
        prefix: 'tree',
        title: 'Memorial tree plaques',
        note: product.heroNote || 'A tree that grows, and their name beside it.',
        hero: {
          base: `${category}/tree-hero`,
          alt: 'Brushed brass memorial plaque reading This cherry tree was planted in loving memory of Jim Partridge, on an oak board and black steel ground stake beside a young cherry tree in blossom',
          caption: <>Shown: A5 brushed brass on an oak board, {priceOf('brushed-brass-210x148-rect-light-wood-plaque')}, with a ground stake (ask us). {seeThis('brushed-brass-210x148-rect-light-wood-plaque')}</>,
        },
        priceNote: 'A5 stainless steel plate, with engraving and UK delivery; the oak board and stake cost extra',
        examples: {
          kicker: 'Memorial tree plaques in place',
          title: 'Beside the tree, never fixed to it.',
          intro: 'Each plate stands on an oak board on a black steel ground stake, pushed into the soil at the foot of the tree. Ask us for the stake on WhatsApp.',
          // The cherry tree is the top photo, so the row starts with the next one.
          items: examples.filter(example => !example.image.includes('-cherry')).map(example => ({ ...example, image: example.image.replace(/\.webp$/, '-900.webp') })),
        },
        sizes: {
          title: 'Choose a size for the tree.',
          intro: 'A5 suits most memorial trees; choose A4 for a school, an orchard or several names. Each plate is drawn to scale.',
          sizes: [
            { slug: 'brushed-stainless-200x150-rect-plaque', label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
            { slug: 'a5-brushed-steel-personalised-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A dedication, a name and a message' },
            { slug: 'brushed-stainless-200x200-circle-plaque', label: '200 mm round', widthMm: 200, heightMm: 200, fits: 'A short dedication', shape: 'circle' },
            { slug: 'brushed-stainless-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A school, an orchard or several names' },
          ],
          note: <>Prices are for brushed stainless steel plates, including engraving, fixings and UK delivery. An oak board is priced on each plaque; ask us for the ground stake.</>,
        },
        portraits: true,
        wording: {
          title: 'Tree plaque wording ideas.',
          intro: 'Most start with a dedication, then the name, the years and a short line about them.',
          inscriptions: [
            { title: 'A memorial tree', lines: ['This cherry tree was planted', 'in loving memory of', 'Jim Partridge', '1947 – 2025'] },
            { title: 'Planted for', lines: ['Planted for', 'Grandpa Ted', '1938 – 2024', 'who taught us the name', 'of every tree'] },
            { title: 'A school tree', lines: ['This tree was planted', 'by the children of', 'Ashfield Primary School', 'in memory of Mrs Long'] },
            { title: 'For a pet', lines: ['This silver birch', 'is for', 'Biscuit', 'our beautiful spaniel'] },
          ],
        },
        related: related(<>See <a href="/garden-plaques">garden plaques</a>, <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">memorial wording ideas</a>.</>),
      };

    case 'opening-plaques':
      return {
        prefix: 'opening',
        title: 'Opening plaques',
        note: product.heroNote || 'Mark the occasion clearly.',
        hero: {
          base: `${category}/opening-hero-v2`,
          alt: 'Brushed stainless steel opening plaque reading The Meadows Community Hub was officially opened by Councillor Jean Mitchell, Mayor of Westbrook, 14 March 2026, on pale limestone cladding beside the glass entrance of a new community centre',
          caption: <>Shown: A4 brushed stainless steel, the plaque priced below. {seeThis('brushed-stainless-297x210-rect-plaque')}</>,
        },
        priceNote: 'A4 stainless steel, with engraving, fixings and UK delivery',
        sizes: {
          title: 'Choose a size for the occasion.',
          intro: 'A4 gives a heading, the opening person and the date room to breathe. Each plate is drawn to scale.',
          sizes: [
            { slug: 'a5-brushed-steel-personalised-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A room or a short dedication' },
            { slug: 'brushed-stainless-300x200-rect-plaque', label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A wider layout for long names' },
            { slug: 'brushed-stainless-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'The usual size for an opening' },
            { slug: 'brushed-stainless-400x300-rect-plaque', label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A building, or a list of supporters' },
          ],
          note: <>Prices are for brushed stainless steel without wood backing, including engraving, fixings and UK delivery. Brass and oak or dark wood backing are priced on each plaque. Need it for a date? {ask('Tell us on WhatsApp')} before ordering.</>,
        },
        steps: [
          ['Add your words', 'Design it online, or send us the names and date on WhatsApp and we’ll lay it out for you.'],
          ['Check your free proof', 'Download the proof PDF to share with colleagues, and agree one final version.'],
          ['Approve, then pay', 'We etch it into solid metal, infill it by hand and deliver it free in the UK.'],
        ],
        proofCopy: 'Before anything is made, you get a PDF proof with every measurement, the finish and the fixings. Share it with colleagues and agree the spelling, titles and date before approving.',
        wording: {
          title: 'Opening plaque wording ideas.',
          intro: 'Confirm the official venue name, titles, spellings and the date with everyone involved before you approve the proof.',
          inscriptions: [
            { title: 'A building opening', lines: ['Riverside Community Centre', 'officially opened by', '[Name and title]', 'on [Day Month Year]'] },
            { title: 'Recognising support', lines: ['The Reading Garden', 'created with the generous', 'support of [Supporter]', 'Opened [Day Month Year]'] },
            { title: 'A new room', lines: ['The Willow Room', 'Opened on 21 June 2025', 'by the Mayor of Ashby'] },
            { title: 'A club', lines: ['The New Clubhouse', 'was officially opened by', 'the Mayor of Kingsmead', '7 September 2024'] },
          ],
          link: { href: '/contact', label: 'Discuss a deadline, logo or crest' },
        },
        related: related(<>See <a href="/brass-plaques">brass plaques</a> and <a href="/stainless-steel-plaques">stainless steel plaques</a>, or <a href="/how-it-works">how the free proof works</a> before your ceremony.</>),
      };

    case 'custom-plaques':
      return {
        prefix: 'custom',
        title: 'Custom plaques',
        note: 'Ovals, circles, larger sizes and your own ideas.',
        hero: {
          base: `${category}/custom-hero-v2`,
          alt: 'Oval brushed stainless steel house sign reading Hawthorn House, built 1898, on the white-painted brick wall of a cottage beside a sage-green front door',
          caption: <>Shown: a 250 × 150 mm oval in brushed stainless steel, the plaque priced below. {seeThis('brushed-stainless-250x150-oval-plaque')}</>,
        },
        price: { label: `from ${priceOf('brushed-stainless-250x150-oval-plaque')}`, slug: 'brushed-stainless-250x150-oval-plaque' },
        priceNote: `Ovals from ${priceOf('brushed-stainless-250x150-oval-plaque')} and circles from ${priceOf('brushed-stainless-200x200-circle-plaque')}, with engraving and UK delivery. Other sizes: free quote`,
        routes: {
          kicker: 'Shapes and sizes',
          title: 'Choose a shape.',
          routes: [
            { href: '/aged-brass-250x150-oval-plaque', title: 'Oval', image: photo('aged-brass-250x150-oval-plaque'), alt: 'Oval aged brass plaque reading Grandad’s Garden, made with love, on a white rendered wall', priceSlug: 'aged-brass-250x150-oval-plaque' },
            { href: '/brushed-stainless-200x200-circle-plaque', title: 'Circle', image: photo('brushed-stainless-200x200-circle-plaque'), alt: 'Round brushed stainless steel plaque reading Welcome to the Old School, 1874', priceSlug: 'brushed-stainless-200x200-circle-plaque' },
            { href: '/orbital-brass-matt-lacquer-400x300-rect-plaque', title: 'Large', image: photo('orbital-brass-matt-lacquer-400x300-rect-plaque'), alt: 'Large orbital brass plaque with a scalloped border recording the consecration of a churchyard extension, on a stone wall', priceSlug: 'orbital-brass-matt-lacquer-400x300-rect-plaque' },
            { href: '/portrait-plaques', title: 'With a portrait', image: `${memorial}/portrait-bramble-v3.webp`, alt: 'Brass pet memorial plaque with an engraved portrait of Bramble the springer spaniel on an oak board, on our workshop bench after its final polish', priceSlug: 'a5-brushed-steel-personalised-plaque' },
          ],
          more: <>Another shape, or a size up to 600 mm? {ask('Send us the measurements on WhatsApp')} for a free quote. Made a design in ChatGPT? <a href="/ai-plaque-design">We’ll make it real</a>.</>,
        },
        sizes: {
          title: 'Choose a shape and size.',
          intro: 'Ovals and circles suit house names and short dedications; larger plates suit histories and honours boards. Each is drawn to scale.',
          sizes: [
            { slug: 'brushed-stainless-250x150-oval-plaque', label: '250 × 150 mm oval', widthMm: 250, heightMm: 150, fits: 'A house name or a short memorial', shape: 'oval' },
            { slug: 'brushed-stainless-200x200-circle-plaque', label: '200 mm round', widthMm: 200, heightMm: 200, fits: 'A short dedication', shape: 'circle' },
            { slug: 'brushed-stainless-300x200-rect-plaque', label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A sign, or a longer tribute' },
            { slug: 'brushed-stainless-400x300-rect-plaque', label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A history or an honours board' },
          ],
          note: <>Prices are for brushed stainless steel without wood backing, including engraving, fixings and UK delivery. Larger sizes up to 600 mm, other shapes and supplied artwork: free quote.</>,
        },
        wording: {
          title: 'Custom plaque wording ideas.',
          intro: 'A short line suits an oval or a circle; save longer lists for a larger plate.',
          inscriptions: [
            { title: 'A house name', lines: ['Apple Tree', 'Cottage'] },
            { title: 'For a pet', lines: ['Here lies', 'Willow', 'The sweetest cat', '2005 – 2023'] },
            { title: 'An honours board', lines: ['Past Presidents', '2016 – 2018 Frank Morley', '2018 – 2020 Ian Ferris', '2020 – 2022 Joy Abbott'] },
            { title: 'A local history', lines: ['In this house lived', 'Dr Emily Hart', 'pioneering country doctor', '1871 – 1949'] },
          ],
          link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
        },
        related: related(<>See <a href="/portrait-plaques">portrait plaques</a>, <a href="/ai-plaque-design">AI designs made real</a> and <a href="/plaque-sizes">every standard size and price</a>.</>),
      };

    default:
      return undefined;
  }
}
