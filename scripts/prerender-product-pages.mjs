import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteBaseUrl = 'https://instaplaque.co.uk';
const shareImage = `${siteBaseUrl}/site-images/home-realistic-proof-row.jpg`;

const homeFaqs = [
  ['Is my proof really free?', 'Yes. Your proof is 100% free with no account, no sign up and no obligation to buy. If you need time to decide, download the proof PDF and use the link inside it to come back later.'],
  ['How much does a custom plaque cost?', 'Standard UK plaque prices are shown before checkout, including engraving, standard fixings and UK mainland delivery. Bench plaques start from £58.50, A5 plaques from £95.50 and A4 plaques from £145. Custom sizes are available up to our maximum size and may need a longer turnaround.'],
  ['Can I preview my plaque before ordering?', 'Yes. Add your wording, choose the material and size, then review a free proof before you pay. You can keep editing until the layout, wording and finish look right.'],
  ['What size is a bench plaque?', 'The compact bench plaque format starts at 150 x 50 mm for short inscriptions. Larger standard bench plaques are available, and custom sizes, oval plaques and circular plaques can be made up to our maximum size.'],
  ['Which material is best for an outdoor plaque?', 'Brushed stainless steel is clean and restrained for exposed outdoor settings. Brass gives a warmer traditional look, and aged brass is hand-patinated for more character.'],
  ['Do you make brass and stainless steel plaques?', 'Yes. Current options include brushed brass, polished brass, aged brass, orbital brass, brushed stainless steel and mirror stainless steel, with optional wood backing on suitable sizes.'],
];

const pages = [
  {
    slug: 'memorial-plaques',
    title: 'Memorial Plaques UK | Brass & Stainless Steel Remembrance Plaques',
    description: 'Create a custom memorial plaque for a grave, garden, bench or remembrance wall. Choose brass or stainless steel and approve a proof before ordering.',
    price: 95.5,
    image: '/site-images/plaque-hero-memorial-wall-desktop.jpg',
    productType: 'Memorial plaques',
    faqs: [
      ['Can I check a memorial plaque before ordering?', 'Yes. Enter the wording and review a free online proof before approving the plaque for checkout.'],
      ['Which material is best for a memorial plaque?', 'Brass gives a traditional warm finish, while stainless steel is a clean outdoor option. Wood backing can be added for wall and presentation plaques.'],
    ],
  },
  {
    slug: 'bench-plaques',
    title: 'Bench Plaques UK | Custom Brass & Stainless Steel Bench Plaques',
    description: 'Order custom bench plaques in brass or stainless steel. Build a proof online, check the inscription and see live pricing before payment.',
    price: 58.5,
    image: '/site-images/home-carousel-bench-steel.webp',
    productType: 'Bench plaques',
    faqs: [
      ['Is the small size enough for a memorial?', 'Yes, for short wording. If the inscription has several lines, start with the medium plaque instead.'],
      ['Can this be used outside?', 'Yes. Choose stainless steel or brass with standard screw fixings for outdoor use.'],
    ],
  },
  {
    slug: 'brass-plaques',
    title: 'Brass Plaques UK | Custom Engraved Brass Plaques',
    description: 'Custom brass plaques for memorials, benches, openings and presentation use. Choose brushed, polished, orbital or aged brass and approve a proof online.',
    price: 105.5,
    image: '/site-images/home-gallery-brass-bench.webp',
    productType: 'Brass plaques',
    faqs: [
      ['Can I choose the brass finish?', 'Yes. The proof bench includes brushed brass, polished brass, orbital brass and aged brass options.'],
      ['Are brass plaques suitable outside?', 'Yes, brass can be used outdoors. Aged brass is hand-patinated and sealed, while brushed and polished brass will naturally change over time.'],
    ],
  },
  {
    slug: 'stainless-steel-plaques',
    title: 'Stainless Steel Plaques UK | Outdoor Metal Plaques Made to Order',
    description: 'Custom stainless steel plaques for outdoor, wall, bench and memorial use. Choose brushed or polished stainless and approve your proof before payment.',
    price: 95.5,
    image: '/site-images/home-carousel-steel-wall.webp',
    productType: 'Stainless steel plaques',
    faqs: [
      ['Which stainless steel finishes are available?', 'You can start with brushed stainless or polished stainless and review the finish in the online plaque proof.'],
      ['Are stainless steel plaques good for outdoors?', 'Yes. Stainless steel is a strong choice for outdoor plaques, bench plaques and contemporary wall plaques.'],
    ],
  },
  {
    slug: 'a5-plaques',
    title: 'A5 Plaques UK | Custom A5 Memorial & Wall Plaques',
    description: 'Create a custom A5 plaque in brass or stainless steel. A practical size for memorials, gardens, wall plaques and presentation wording.',
    price: 95.5,
    image: '/site-images/home-carousel-garden-brass.webp',
    productType: 'A5 plaques',
    faqs: [
      ['Is this the best starting size?', 'Usually, yes. It gives the proofing system enough room for a clear title, dates and a short message.'],
      ['Can I add a wooden backing?', 'Yes. Wood backing is priced live and shown in the proof before you order.'],
    ],
  },
  {
    slug: 'a4-plaques',
    title: 'A4 Plaques UK | Large Custom Memorial & Presentation Plaques',
    description: 'Large custom A4 plaques in brass or stainless steel for longer wording, openings, donor recognition, memorials and presentation displays.',
    price: 145,
    image: '/site-images/home-carousel-reading-room.webp',
    productType: 'A4 plaques',
    faqs: [
      ['When should I choose large?', 'Choose large for longer wording, formal openings, donor recognition or anything that needs to be read from further away.'],
      ['Will the price still show before ordering?', 'Yes. Standard large plaques can be priced before checkout, with extras shown before payment.'],
    ],
  },
  {
    slug: 'custom-plaques',
    title: 'Custom Plaques UK | Bespoke Oval, Circular & Made-to-Measure Plaques',
    description: 'Start a custom plaque proof for bespoke sizes, oval plaques, circular plaques and made-to-measure brass or stainless steel plaques.',
    price: 145,
    image: '/site-images/home-custom-oval-steel.webp',
    productType: 'Custom plaques',
    faqs: [
      ['Can bespoke plaques still use instant proofing?', 'Yes. The proof helps establish the design quickly, even if the final price needs manual confirmation.'],
      ['What triggers a quote?', 'Oversized plaques, custom shapes, longer-turnaround finishes and unusual mounting should be checked before payment.'],
    ],
  },
];

const landingPages = [
  {
    slug: 'garden-plaques',
    title: 'Garden Plaques UK | Custom Memorial Garden Plaques',
    description: 'Garden plaques for memorial corners, trees, benches, planted areas, walls and family gardens. Choose brass or stainless steel and check a proof before ordering.',
    image: '/site-images/home-carousel-garden-brass.webp',
    pageName: 'Garden plaques',
    faqs: [
      ['Can garden plaques be used outside?', 'Yes. Choose brass or stainless steel with suitable fixings. The proof shows the layout, material and fixings before payment.'],
      ['What size is best for a garden plaque?', 'A5 is a good starting point for names, dates and a short message. Bench plaque sizes work better for very short wording.'],
    ],
    relatedSearches: ['garden plaques UK', 'memorial garden plaques', 'tree dedication plaques', 'outdoor memorial plaques'],
  },
  {
    slug: 'opening-plaques',
    title: 'Opening Plaques UK | Custom Building Opening Plaques',
    description: 'Opening plaques for schools, offices, community centres and formal unveilings. Create a clear proof for the place, opening person and date.',
    image: '/site-images/home-gallery-brass-community.webp',
    pageName: 'Opening plaques',
    faqs: [
      ['Can I include the person opening the building?', 'Yes. Add the person, role, date and venue wording, then check the hierarchy in the proof before checkout.'],
      ['Which size suits an opening plaque?', 'A4 is usually best for formal opening wording. A5 can work for shorter inscriptions or smaller rooms.'],
    ],
    relatedSearches: ['opening plaques UK', 'building opening plaques', 'unveiling plaques', 'presentation plaques'],
  },
  {
    slug: 'commemorative-plaques',
    title: 'Commemorative Plaques UK | Custom Recognition Plaques',
    description: 'Commemorative plaques for people, places, projects, anniversaries and public recognition. Choose the right size and check the proof before ordering.',
    image: '/site-images/home-carousel-reading-room.webp',
    pageName: 'Commemorative plaques',
    faqs: [
      ['What can a commemorative plaque be used for?', 'Common uses include anniversaries, donors, openings, restorations, memorials, public spaces and recognition wording.'],
      ['Can I check longer wording before ordering?', 'Yes. The online proof lets you review line breaks, hierarchy and spacing before approving the plaque.'],
    ],
    relatedSearches: ['commemorative plaques UK', 'recognition plaques', 'donor plaques', 'custom dedication plaques'],
  },
  {
    slug: 'engraved-plaques',
    title: 'Engraved Plaques UK | Custom Brass & Stainless Steel Plaques',
    description: 'Custom engraved plaques for memorials, benches, gardens, buildings, awards and openings. Choose the size, material and wording before checkout.',
    image: '/site-images/home-realistic-proof-row.jpg',
    pageName: 'Engraved plaques',
    faqs: [
      ['Can I order one engraved plaque?', 'Yes. InstaPlaque is set up for single custom plaque orders as well as bespoke requests.'],
      ['Do engraved plaques include delivery?', 'UK mainland delivery is included for standard plaques. Unusual sizes or non-mainland delivery may need confirmation before payment.'],
    ],
    relatedSearches: ['engraved plaques UK', 'custom engraved plaques', 'engraved brass plaques', 'engraved metal plaques'],
  },
  {
    slug: 'pet-memorial-plaques',
    title: 'Pet Memorial Plaques UK | Custom Garden Pet Plaques',
    description: 'Pet memorial plaques for gardens, homes, stables and remembrance corners. Add a name, dates and short message, then check the proof before payment.',
    image: '/site-images/plaque-hero-cat.png',
    pageName: 'Pet memorial plaques',
    faqs: [
      ['Can I make a memorial plaque for a dog or cat?', 'Yes. Add the pet name, dates and message, then approve the proof before checkout.'],
      ['Can a pet memorial plaque go outside?', 'Yes. Brass and stainless steel are suitable for outdoor use with appropriate fixings.'],
    ],
    relatedSearches: ['pet memorial plaques UK', 'dog memorial plaques', 'cat memorial plaques', 'horse memorial plaques'],
  },
  {
    slug: 'tree-plaques',
    title: 'Tree Plaques UK | Custom Memorial Tree Dedication Plaques',
    description: 'Tree plaques for memorial trees, donated trees, family gardens and community planting projects, made in brass or stainless steel.',
    image: '/site-images/home-carousel-garden-brass.webp',
    pageName: 'Tree plaques',
    faqs: [
      ['What should a tree plaque say?', 'Most tree plaques include a name, date and short dedication. The proof helps check that the wording is not too crowded.'],
      ['Which material is best for a tree plaque?', 'Brass and stainless steel are both suitable. Stainless is cleaner and more contemporary; brass is warmer and more traditional.'],
    ],
    relatedSearches: ['tree plaques UK', 'memorial tree plaques', 'tree dedication plaques', 'donated tree plaques'],
  },
  {
    slug: 'donor-plaques',
    title: 'Donor Plaques UK | Custom Recognition & Fundraising Plaques',
    description: 'Donor plaques for funded projects, restorations, gardens, rooms, benches and public recognition, with a proof before production.',
    image: '/site-images/home-gallery-brass-community.webp',
    pageName: 'Donor plaques',
    faqs: [
      ['Can a donor plaque include multiple names?', 'Yes. For longer donor lists, start with A4 or a custom plaque so the text remains readable.'],
      ['Can I proof a fundraising plaque before paying?', 'Yes. Create the proof online and check the layout before approving checkout.'],
    ],
    relatedSearches: ['donor plaques UK', 'recognition plaques', 'fundraising plaques', 'sponsor plaques'],
  },
  {
    slug: 'memorial-bench-plaques',
    title: 'Memorial Bench Plaques UK | Custom Bench Dedication Plaques',
    description: 'Memorial bench plaques for names, dates and short dedications. Choose brass, aged brass or stainless steel and check the proof before ordering.',
    image: '/seo/realistic/memorial-bench-plaques/hero-16x9.jpg',
    pageName: 'Memorial bench plaques',
    faqs: [
      ['What size is a memorial bench plaque?', 'The compact bench plaque starts at 150 x 50 mm and is best for short inscriptions.'],
      ['Can I preview the bench plaque before ordering?', 'Yes. Enter the wording and review the free proof before checkout.'],
      ['What wording fits on a memorial bench plaque?', 'A name, dates and one short dedication usually works best. If the message needs several sentences, choose a larger plaque rather than forcing the text into a bench size.'],
      ['Are screw fixings included?', 'Standard screw fixings are included for standard bench plaques, and the proof shows where the visible fixings sit.'],
    ],
    relatedSearches: ['memorial bench plaques UK', 'bench dedication plaques', 'engraved bench plaques', 'brass bench memorial plaques'],
  },
  {
    slug: 'ashes-scattering-plaques',
    title: 'Ashes Scattering Plaques UK | Custom Remembrance Plaques',
    description: 'Ashes scattering plaques for gardens, trees, benches and remembrance areas, with simple respectful wording checked in a proof before ordering.',
    image: '/site-images/plaque-hero-memorial-wall-desktop.jpg',
    pageName: 'Ashes scattering plaques',
    faqs: [
      ['Can I make a plaque for an ashes scattering area?', 'Yes. Add the name, dates and short message, then review the proof before checkout.'],
      ['Which size should I choose?', 'A5 is a good starting point for a name, dates and short tribute. Bench sizes are better for very short wording.'],
    ],
    relatedSearches: ['ashes scattering plaques UK', 'scattering garden plaques', 'remembrance garden plaques', 'ashes memorial plaques'],
  },
  {
    slug: 'school-opening-plaques',
    title: 'School Opening Plaques UK | Custom School Building Plaques',
    description: 'School opening plaques for new buildings, classrooms, libraries, gardens and formal unveilings, proofed before production.',
    image: '/site-images/home-carousel-reading-room.webp',
    pageName: 'School opening plaques',
    faqs: [
      ['Can I include a headteacher, mayor or MP name?', 'Yes. Add the name, role and date, then check the formal layout in the proof.'],
      ['Which material suits a school opening plaque?', 'Brass is traditional for ceremonial plaques. Stainless steel is a good choice for modern school interiors and outdoor spaces.'],
    ],
    relatedSearches: ['school opening plaques UK', 'school building plaques', 'classroom opening plaques', 'library opening plaques'],
  },
];

const faqSchema = (faqs) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
});

const productListSchema = () => ({
  '@type': 'ItemList',
  name: 'Custom plaque formats',
  itemListElement: pages.map((page, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Product',
      name: page.productType,
      description: page.description,
      image: `${siteBaseUrl}${page.image}`,
      brand: { '@type': 'Brand', name: 'InstaPlaque' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'GBP',
        price: page.price.toString(),
        availability: 'https://schema.org/InStock',
        url: `${siteBaseUrl}/${page.slug}`,
      },
    },
  })),
});

const routePages = [
  {
    slug: '',
    title: 'Custom Plaques Made Simple | Brass, Stainless Steel & Bench Plaques UK',
    description: 'Design a brass, stainless steel, memorial or bench plaque online. See a free proof, clear live pricing and UK mainland delivery before you order.',
    schema: [productListSchema(), faqSchema(homeFaqs)],
  },
  {
    slug: 'design',
    title: 'Design a Custom Plaque Online | Free InstaPlaque Proof',
    description: 'Use the InstaPlaque online plaque designer to create a free proof for a custom brass, stainless steel, bench or memorial plaque before checkout.',
    schema: [{
      '@type': 'WebApplication',
      name: 'InstaPlaque online plaque designer',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    }],
  },
  {
    slug: 'materials',
    title: 'Plaque Materials UK | Brass, Stainless Steel & Wood Backing',
    description: 'Compare brass, aged brass, stainless steel and wood-backed plaque finishes before ordering your UK plaque proof.',
    schema: [{
      '@type': 'CollectionPage',
      name: 'Plaque materials',
      description: 'Brass, aged brass, stainless steel and wood backing options for custom UK plaques.',
    }],
  },
  {
    slug: 'how-it-works',
    title: 'How Online Plaque Proofing Works | InstaPlaque UK',
    description: 'Create a plaque proof online, approve the design, pay securely and receive your custom plaque after production.',
    schema: [{
      '@type': 'HowTo',
      name: 'How to order a custom plaque online',
      description: 'Create, approve and order a custom plaque online with a free proof before checkout.',
      step: ['Choose plaque options', 'Add your wording', 'Review the free proof', 'Approve the design', 'Checkout securely'],
    }],
  },
  {
    slug: 'faq',
    title: 'Custom Plaque FAQs UK | InstaPlaque',
    description: 'Answers about custom plaque prices, materials, proofing, UK delivery, fixings, aged brass and bespoke plaque orders.',
    schema: [faqSchema(homeFaqs)],
  },
  {
    slug: 'quote',
    title: 'Custom Plaque Quotes UK | InstaPlaque',
    description: 'Start a proof for custom plaque sizes, oval plaques, circular plaques and longer-turnaround plaque orders in the UK.',
  },
  {
    slug: 'contact',
    title: 'Contact InstaPlaque | Custom Plaque Orders UK',
    description: 'Contact InstaPlaque for custom plaque proofs, order questions, delivery support and bespoke brass or stainless steel plaque enquiries.',
    schema: [{
      '@type': 'ContactPage',
      name: 'Contact InstaPlaque',
      description: 'Contact details for InstaPlaque custom plaque orders and support.',
    }],
  },
  {
    slug: 'terms',
    title: 'Terms and Conditions | InstaPlaque UK',
    description: 'Read the InstaPlaque terms for custom plaque proofs, secure payment, UK delivery, production times and made-to-order plaque orders.',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy | InstaPlaque UK',
    description: 'How InstaPlaque uses customer, order, proof and delivery details to process UK custom plaque orders and provide support.',
    schema: [{ '@type': 'PrivacyPolicy', name: 'InstaPlaque privacy policy' }],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy | InstaPlaque UK',
    description: 'Cookie and essential storage information for the InstaPlaque online proof, checkout and admin systems.',
  },
  {
    slug: 'returns-and-cancellations',
    title: 'Returns and Cancellations | Custom Plaques UK | InstaPlaque',
    description: 'Returns, cancellation and faulty goods information for personalised InstaPlaque brass and stainless steel plaque orders.',
  },
];

const escapeAttr = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const replaceTag = (html, pattern, replacement) => html.replace(pattern, replacement);

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const baseHtml = await readFile(indexPath, 'utf8');

const writePrerenderedPage = async ({
  slug,
  title,
  description,
  schema = [],
  productSchema = null,
}) => {
  const pathPart = slug ? `/${slug}` : '/';
  const url = `${siteBaseUrl}${pathPart}`;
  let html = baseHtml;
  html = replaceTag(html, /<title>.*?<\/title>/, `<title>${escapeAttr(title)}</title>`);
  html = replaceTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeAttr(description)}" />`);
  html = replaceTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeAttr(title)}" />`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeAttr(description)}" />`);
  html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = replaceTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${shareImage}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeAttr(description)}" />`);
  html = replaceTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${shareImage}" />`);

  const routeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { '@id': `${siteBaseUrl}/#website` },
      },
      ...(productSchema ? [productSchema] : []),
      ...schema,
    ],
  };
  html = html.replace('</head>', `  <script type="application/ld+json" id="instaplaque-prerender-route-schema">${JSON.stringify(routeSchema)}</script>\n</head>`);

  if (!slug) {
    await writeFile(indexPath, html);
    return;
  }

  const pageDir = path.join(distDir, slug);
  await mkdir(pageDir, { recursive: true });
  await writeFile(path.join(pageDir, 'index.html'), html);
};

for (const page of routePages) {
  await writePrerenderedPage(page);
}

for (const page of pages) {
  const url = `${siteBaseUrl}/${page.slug}`;
  await writePrerenderedPage({
    slug: page.slug,
    title: page.title,
    description: page.description,
    productSchema: {
      '@type': 'Product',
      '@id': `${url}#product`,
      name: page.productType,
      description: page.description,
      image: `${siteBaseUrl}${page.image}`,
      brand: { '@type': 'Brand', name: 'InstaPlaque' },
      category: 'Custom engraved plaques',
      material: 'Brass or stainless steel',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'GBP',
        price: page.price.toString(),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        url,
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
          shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'GBP' },
        },
      },
    },
    schema: [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteBaseUrl },
          { '@type': 'ListItem', position: 2, name: page.productType, item: url },
        ],
      },
      faqSchema(page.faqs),
    ],
  });
}

for (const page of landingPages) {
  const url = `${siteBaseUrl}/${page.slug}`;
  await writePrerenderedPage({
    slug: page.slug,
    title: page.title,
    description: page.description,
    schema: [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        name: page.pageName,
        description: page.description,
        image: `${siteBaseUrl}${page.image}`,
        about: page.relatedSearches,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteBaseUrl },
          { '@type': 'ListItem', position: 2, name: page.pageName, item: url },
        ],
      },
      faqSchema(page.faqs),
    ],
  });
}

const merchantFeedPages = pages.filter((page) => page.slug !== 'custom-plaques');

const feedItems = merchantFeedPages.map((page) => {
  const url = `${siteBaseUrl}/${page.slug}`;
  const imageUrl = `${siteBaseUrl}${page.image}`;
  return `    <item>
      <g:id>instaplaque-${page.slug}</g:id>
      <g:title>${escapeAttr(page.title.replace(' UK | Free Online Plaque Proof', ''))}</g:title>
      <g:description>${escapeAttr(page.description)}</g:description>
      <g:link>${url}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand>InstaPlaque</g:brand>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${page.price.toFixed(2)} GBP</g:price>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>Home &amp; Garden &gt; Decor</g:google_product_category>
      <g:product_type>Custom engraved plaques &gt; ${escapeAttr(page.productType)}</g:product_type>
      <g:adult>no</g:adult>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>UK mainland standard delivery</g:service>
        <g:price>0.00 GBP</g:price>
      </g:shipping>
    </item>`;
}).join('\n');

const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>InstaPlaque Google Merchant Feed</title>
    <link>${siteBaseUrl}</link>
    <description>Custom engraved plaque products from InstaPlaque.</description>
${feedItems}
  </channel>
</rss>
`;

await writeFile(path.join(distDir, 'google-merchant-feed.xml'), feedXml);
