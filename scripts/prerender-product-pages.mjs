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
    description: 'Memorial plaques in brass or stainless steel. Add the wording, check the proof, then order online.',
    price: 95.5,
    image: '/site-images/plaque-hero-memorial-wall-desktop.jpg',
    productType: 'Memorial plaques',
    faqs: [
      ['Can I check a memorial plaque before ordering?', 'Yes. Enter the wording and review a free online proof before approving the plaque for checkout.'],
      ['Which material is best for a memorial plaque?', 'Choose brass for a classic gold plaque. Choose stainless steel for a silver modern plaque. Add wood backing for wall plaques.'],
    ],
  },
  {
    slug: 'bench-plaques',
    title: 'Bench Plaques UK | Custom Brass & Stainless Steel Bench Plaques',
    description: 'Small engraved bench plaques from £58.50. Brass or stainless steel, with a free proof before payment.',
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
    description: 'Custom brass plaques for memorials, benches, openings and presentation use. Choose the finish and approve a proof online.',
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
    description: 'Custom stainless steel plaques for outdoor, wall, bench and memorial use. Choose brushed or polished stainless and approve a proof before payment.',
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
    description: 'A5 metal plaques for memorial, garden, wall and presentation wording. Choose brass or stainless steel and check a proof online.',
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
    description: 'Large A4 plaques in brass or stainless steel for longer wording, openings, donor recognition and memorial displays.',
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
    description: 'Start a custom plaque proof for bespoke sizes, oval plaques, circular plaques and made-to-measure metal plaques.',
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
    description: 'Garden plaques for trees, benches, planted areas, walls and family gardens. Choose brass or stainless steel and check a proof before ordering.',
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
    description: 'Commemorative plaques for people, places, projects and dates. Choose the size, add wording and approve the proof.',
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
    description: 'Pet memorial plaques for gardens, homes and stables. Add a name, dates and short message, then check the proof before payment.',
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
    description: 'Tree plaques for memorial trees, donated trees and planting projects, made in brass or stainless steel.',
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
    description: 'Donor plaques for funded projects, restorations, rooms, gardens and public recognition, with a proof before production.',
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
    description: 'Order memorial bench plaques from £58.50. Brass, aged brass or stainless steel, free online proof, standard fixings and UK mainland delivery included.',
    image: '/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp',
    pageName: 'Memorial bench plaques',
    faqs: [
      ['What size is a memorial bench plaque?', 'The compact bench plaque starts at 150 x 50 mm and is best for short inscriptions.'],
      ['Can I preview the bench plaque before ordering?', 'Yes. Enter the wording and review the free proof before checkout.'],
      ['What wording fits on a memorial bench plaque?', 'A name, dates and one short message usually works best. Choose a larger plaque for poems or longer wording.'],
      ['Are screw fixings included?', 'Standard screw fixings are included for standard bench plaques, and the proof shows where the visible fixings sit.'],
    ],
    relatedSearches: ['memorial bench plaques UK', 'bench dedication plaques', 'engraved bench plaques', 'brass bench memorial plaques'],
  },
  {
    slug: 'brass-memorial-plaques',
    title: 'Brass Memorial Plaques UK | Custom Engraved Remembrance Plaques',
    description: 'Order brass memorial plaques for benches, gardens and walls. Bench plaques from £58.50, A5 brass memorial plaques from £105.50, free proof before payment.',
    image: '/seo/realistic/memorial-plaques/brass-bench-plaque-garden-rail.webp',
    pageName: 'Brass memorial plaques',
    faqs: [
      ['Are brass memorial plaques suitable outside?', 'Yes. Brass can be used outdoors and is a common choice for benches, gardens and walls.'],
      ['Can I check a brass memorial plaque before ordering?', 'Yes. Create the wording online and approve the proof before checkout.'],
      ['What wording fits on a brass memorial plaque?', 'Most include a name, dates and one or two short lines. Longer messages usually need A5, A4 or a custom size.'],
    ],
    relatedSearches: ['brass memorial plaques UK', 'engraved brass memorial plaques', 'brass remembrance plaques', 'brass bench memorial plaques'],
  },
  {
    slug: 'wall-memorial-plaques',
    title: 'Wall Memorial Plaques UK | Custom Brass & Stainless Remembrance Plaques',
    description: 'Order wall memorial plaques in brass or stainless steel. A5, A4 and wood-backed options with free online proof before payment.',
    image: '/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp',
    pageName: 'Wall memorial plaques',
    faqs: [
      ['Can wall memorial plaques be used outside?', 'Yes. Brass and stainless steel are suitable for outdoor use with appropriate fixings.'],
      ['Which size is best for a wall memorial plaque?', 'A5 works for shorter wording. A4 or custom sizing is better for longer messages.'],
      ['Can I add a quote or family message?', 'Yes. Add the wording in the designer and check the proof to make sure it stays readable.'],
    ],
    relatedSearches: ['wall memorial plaques UK', 'memorial wall plaques', 'brass wall memorial plaques', 'stainless steel memorial wall plaques'],
  },
  {
    slug: 'ashes-scattering-plaques',
    title: 'Ashes Scattering Plaques UK | Custom Remembrance Plaques',
    description: 'Ashes scattering plaques for gardens, trees and benches. Add simple wording and check the proof before ordering.',
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
    description: 'School opening plaques for new buildings, classrooms, libraries and gardens, proofed before production.',
    image: '/site-images/home-carousel-reading-room.webp',
    pageName: 'School opening plaques',
    faqs: [
      ['Can I include a headteacher, mayor or MP name?', 'Yes. Add the name, role and date, then check the formal layout in the proof.'],
      ['Which material suits a school opening plaque?', 'Brass is traditional for ceremonial plaques. Stainless steel is a good choice for modern school interiors and outdoor spaces.'],
    ],
    relatedSearches: ['school opening plaques UK', 'school building plaques', 'classroom opening plaques', 'library opening plaques'],
  },
];

const pageEnhancements = {
  'memorial-plaques': {
    sections: [
      ['Choose by setting', 'Use the compact bench format for a name, dates and one short line. Choose A5 for most garden and wall memorials, or A4 when a longer family message needs room.'],
      ['Brass or stainless steel', 'Brass gives a warm traditional appearance; aged brass is darker and less reflective. Brushed stainless steel gives a clean silver finish for contemporary settings.'],
      ['Check the complete proof', 'Review spelling, dates, line breaks, border and visible fixing positions before payment. Wood backing can give larger wall plaques more presence.'],
    ],
    examples: [
      ['/seo/realistic/memorial-plaques/brass-wood-backed-wall-plaque.webp', 'Brass memorial wall plaque mounted on dark wood', 'Brass wall memorial'],
      ['/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp', 'Stainless steel memorial plaque with wooden backing', 'Stainless wall memorial'],
      ['/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp', 'Aged brass memorial plaque fixed to an outdoor wooden bench', 'Aged brass bench memorial'],
      ['/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp', 'Stainless steel memorial plaque on a wooden bench rail', 'Stainless bench memorial'],
    ],
  },
  'bench-plaques': {
    sections: [
      ['Keep the inscription concise', 'A name, dates and one short dedication read best on a 150 x 50 mm bench plaque. Move to a larger plaque rather than shrinking a poem or long message.'],
      ['Check the bench owner’s rules', 'Councils, cemeteries, schools and clubs may specify the plaque size, material or fixing method. Confirm this before approving production.'],
      ['Choose the outdoor finish', 'Brass is warm and traditional, aged brass is darker, and brushed stainless steel gives a clean silver appearance. The proof shows the visible screws and border.'],
    ],
    examples: [
      ['/site-images/home-gallery-brass-bench.webp', 'Classic engraved brass plaque fixed to a wooden park bench', 'Classic brass bench plaque'],
      ['/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp', 'Aged brass memorial bench plaque on weathered timber', 'Aged brass bench plaque'],
      ['/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp', 'Brushed stainless steel memorial plaque on a wooden bench rail', 'Stainless steel bench plaque'],
      ['/seo/realistic/memorial-plaques/parents-brass-bench-memorial-plaque.webp', 'Brass bench plaque dedicated to beloved parents', 'Shared family dedication'],
    ],
  },
  'brass-plaques': {
    sections: [
      ['Choose the brass finish', 'Brushed brass is warm and satin, polished brass is brighter and more reflective, and aged brass begins with a darker hand-patinated appearance.'],
      ['Where brass works best', 'Brass suits memorials, benches, openings, donor recognition and presentation plaques where a traditional gold finish feels appropriate.'],
      ['Understand outdoor ageing', 'Brass can be used outside but its surface naturally changes with exposure. Select the starting finish for the appearance you want as the plaque ages.'],
    ],
    examples: [
      ['/site-images/home-gallery-brass-bench.webp', 'Brushed brass engraved plaque on an outdoor wooden bench', 'Brushed brass bench plaque'],
      ['/site-images/home-gallery-brass-community.webp', 'Large engraved brass community centre plaque', 'Formal community plaque'],
      ['/site-images/home-gallery-aged-brass-wood.webp', 'Aged brass memorial plaque mounted on dark wood', 'Aged brass on wood'],
      ['/seo/realistic/memorial-plaques/brass-wood-backed-wall-plaque.webp', 'Engraved brass wall plaque with wooden backing', 'Brass wall plaque'],
    ],
  },
  'stainless-steel-plaques': {
    sections: [
      ['Brushed or polished', 'Brushed stainless is restrained and usually easier to read. Polished stainless is brighter and more reflective, making it better suited to controlled indoor light.'],
      ['Outdoor and contemporary settings', 'Stainless steel works well on benches, walls, schools, offices and modern memorials where a clean silver finish is preferred.'],
      ['Design for legibility', 'Black-filled engraving and concise wording provide strong contrast. The proof lets you check the border, fixings and reading size before payment.'],
    ],
    examples: [
      ['/site-images/home-gallery-oval-steel.webp', 'Oval brushed stainless steel engraved memorial plaque', 'Oval stainless plaque'],
      ['/site-images/home-carousel-steel-wall.webp', 'Brushed stainless steel plaque mounted on an exterior wall', 'Stainless wall plaque'],
      ['/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp', 'Stainless steel memorial plaque fixed to outdoor timber', 'Stainless bench plaque'],
      ['/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp', 'Stainless steel plaque mounted on a wooden backing board', 'Steel with wood backing'],
    ],
  },
  'custom-plaques': {
    sections: [
      ['Custom shapes and dimensions', 'Start here for oval, circular or made-to-measure plaques and when A5 or A4 proportions do not suit the available space.'],
      ['Build the layout before quoting', 'Create the wording, material and fixing layout first. Oversized plates, unusual mounting or specialist production can then be checked accurately.'],
      ['Standard sizes remain available', 'The same designer includes compact bench, A5 and A4 starting sizes, so you can compare proportions before choosing a bespoke dimension.'],
    ],
    examples: [
      ['/site-images/home-custom-oval-steel.webp', 'Custom oval stainless steel plaque with engraved wording', 'Custom oval plaque'],
      ['/site-images/home-carousel-oval-wall.webp', 'Oval engraved plaque installed on an exterior wall', 'Oval wall plaque'],
      ['/site-images/home-carousel-black-wall.webp', 'Dark made-to-measure wall plaque with contrasting lettering', 'Contemporary custom plaque'],
      ['/site-images/home-carousel-reading-room.webp', 'Large formal presentation plaque with longer wording', 'Large presentation plaque'],
    ],
  },
  'garden-plaques': {
    sections: [
      ['Choose for the viewing distance', 'A5 is a useful starting point for a name, dates and short message. Keep outdoor wording concise so it remains legible from a path or standing position.'],
      ['Match material to the setting', 'Brass and aged brass sit naturally with timber, brick and planting. Stainless steel gives a cleaner silver finish for contemporary gardens.'],
      ['Plan the mounting surface', 'Decide whether the plaque will be fitted to a wall, post, bench, planter or stone before choosing visible screws or caps.'],
    ],
    examples: [
      ['/site-images/home-carousel-garden-brass.webp', 'Engraved brass memorial plaque displayed in a planted garden', 'Brass garden dedication'],
      ['/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp', 'Aged brass garden plaque on outdoor timber', 'Aged brass outdoors'],
      ['/seo/realistic/memorial-plaques/brass-bench-plaque-garden-rail.webp', 'Brass plaque fitted to a wooden garden rail', 'Garden rail plaque'],
      ['/site-images/home-carousel-steel-wall.webp', 'Brushed stainless steel memorial plaque on an outdoor wall', 'Stainless garden wall plaque'],
    ],
  },
  'opening-plaques': {
    sections: [
      ['Use a formal wording hierarchy', 'Start with the building, room or project name, followed by “Opened by”, the person and role, then the date.'],
      ['Allow enough room', 'A4 is usually best for opening plaques. Long job titles, partner organisations or donor names may require a custom size.'],
      ['Confirm details before approval', 'Check every name, title and ceremony date with the organiser, then use the proof to review line breaks and visual emphasis.'],
    ],
    examples: [
      ['/site-images/home-gallery-brass-community.webp', 'Large engraved brass community centre opening plaque', 'Community opening plaque'],
      ['/site-images/home-carousel-reading-room.webp', 'Formal engraved plaque for a reading room opening', 'Reading room dedication'],
      ['/site-images/home-carousel-steel-wall.webp', 'Brushed stainless steel plaque on a modern building wall', 'Contemporary steel opening plaque'],
      ['/site-images/home-carousel-brass-wall.webp', 'Traditional engraved brass plaque mounted on a wall', 'Traditional brass opening plaque'],
    ],
  },
};

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
    title: 'Custom Plaques UK | Design, Proof & Order Online',
    description: 'Order custom brass, stainless steel, memorial and bench plaques online. Free proof before payment, live standard prices and UK mainland delivery included.',
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
    faqs: homeFaqs,
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
    slug: 'returns-cancellations',
    title: 'Returns and Cancellations | Custom Plaques UK | InstaPlaque',
    description: 'Returns, cancellation and faulty goods information for personalised InstaPlaque brass and stainless steel plaque orders.',
  },
  {
    slug: 'checkout',
    title: 'Secure Checkout | InstaPlaque',
    description: 'Complete payment for an approved InstaPlaque proof.',
    heading: 'Secure plaque checkout',
    robots: 'noindex,nofollow',
  },
  {
    slug: 'order-confirmed',
    title: 'Order Confirmation | InstaPlaque',
    description: 'Confirmation details for an InstaPlaque order.',
    heading: 'Plaque order confirmation',
    robots: 'noindex,nofollow',
  },
  {
    slug: 'admin',
    title: 'Admin | InstaPlaque',
    description: 'InstaPlaque order administration.',
    heading: 'InstaPlaque admin',
    robots: 'noindex,nofollow',
  },
];

const escapeAttr = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const escapeHtml = escapeAttr;

const primaryNav = [
  ['Custom plaques', '/custom-plaques'],
  ['Memorial plaques', '/memorial-plaques'],
  ['Bench plaques', '/bench-plaques'],
  ['Brass plaques', '/brass-plaques'],
  ['Stainless steel plaques', '/stainless-steel-plaques'],
  ['Garden plaques', '/garden-plaques'],
  ['Opening plaques', '/opening-plaques'],
  ['Plaque materials', '/materials'],
  ['How it works', '/how-it-works'],
  ['FAQs', '/faq'],
  ['Contact', '/contact'],
];

const staticNav = () => `<nav aria-label="Primary navigation"><a href="/">InstaPlaque home</a>${primaryNav
  .map(([label, href]) => `<a href="${href}">${escapeHtml(label)}</a>`)
  .join('')}</nav>`;

const staticFaqs = (faqs = []) => faqs.length
  ? `<section aria-labelledby="prerender-faq-heading"><h2 id="prerender-faq-heading">Questions and answers</h2>${faqs
      .map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`)
      .join('')}</section>`
  : '';

const staticPageMarkup = ({
  title,
  heading,
  description,
  image,
  faqs = [],
  price = null,
  relatedSearches = [],
  sections = [],
  examples = [],
  kind = 'page',
}) => {
  const visibleHeading = heading || title.split('|')[0].trim();
  const details = kind === 'product'
    ? `<section aria-labelledby="prerender-buy-heading"><h2 id="prerender-buy-heading">Design and order online</h2><p>Choose the plaque size, material, finish and fixings, then add your wording and check the exact proof before payment.${price ? ` Standard prices start from £${Number(price).toFixed(2).replace(/\.00$/, '')}.` : ''} Standard fixings and UK mainland delivery are included on eligible standard plaques.</p><p>Brass gives a warm, traditional finish. Stainless steel gives a clean, contemporary finish and is well suited to outdoor use. Every approved order is checked before production.</p><a href="/design">Create your free plaque proof</a></section>`
    : kind === 'home'
      ? `<section aria-labelledby="prerender-shop-heading"><h2 id="prerender-shop-heading">Popular custom plaque formats</h2><ul>${pages.map((page) => `<li><a href="/${page.slug}">${escapeHtml(page.productType)}</a> from £${page.price.toFixed(2).replace(/\.00$/, '')}</li>`).join('')}</ul><p>Choose brass or stainless steel, enter the wording and review a free online proof before checkout. Standard plaque prices include engraving, standard fixings and UK mainland delivery.</p><a href="/design">Start a free proof</a></section>`
      : `<section aria-labelledby="prerender-process-heading"><h2 id="prerender-process-heading">Proof your plaque before payment</h2><p>Choose the format, add the wording and review the layout online. Standard prices are shown before checkout, with UK mainland delivery included on eligible standard plaques.</p><a href="/design">Create your free plaque proof</a></section>`;
  const related = relatedSearches.length
    ? `<section aria-labelledby="prerender-related-heading"><h2 id="prerender-related-heading">Related plaque advice</h2><p>${relatedSearches.map(escapeHtml).join(', ')}.</p></section>`
    : '';
  const exampleGallery = examples.length
    ? `<section aria-labelledby="prerender-examples-heading"><h2 id="prerender-examples-heading">Real ${escapeHtml(visibleHeading.toLowerCase())} examples</h2><div>${examples.map(([src, alt, caption]) => `<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" /><figcaption>${escapeHtml(caption)}</figcaption></figure>`).join('')}</div></section>`
    : '';
  const specificAdvice = sections.length
    ? `<section aria-labelledby="prerender-advice-heading"><h2 id="prerender-advice-heading">What to know before ordering</h2>${sections.map(([sectionTitle, copy]) => `<article><h3>${escapeHtml(sectionTitle)}</h3><p>${escapeHtml(copy)}</p></article>`).join('')}</section>`
    : '';
  return `<div class="seo-prerendered-page" data-prerendered="true"><header>${staticNav()}</header><main><article><h1>${escapeHtml(visibleHeading)}</h1><p>${escapeHtml(description)}</p>${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(visibleHeading)} example" />` : ''}${exampleGallery}${specificAdvice}${details}${related}${staticFaqs(faqs)}</article></main><footer><nav aria-label="Legal"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/returns-cancellations">Returns and cancellations</a></nav></footer></div>`;
};

const replaceTag = (html, pattern, replacement) => html.replace(pattern, replacement);

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const baseHtml = await readFile(indexPath, 'utf8');

const writePrerenderedPage = async ({
  slug,
  title,
  description,
  image = shareImage,
  schema = [],
  productSchema = null,
  heading = '',
  faqs = [],
  price = null,
  relatedSearches = [],
  sections = [],
  examples = [],
  kind = 'page',
  robots = 'index,follow',
}) => {
  const pathPart = slug ? `/${slug}` : '/';
  const url = `${siteBaseUrl}${pathPart}`;
  const socialImage = image.startsWith('http') ? image : `${siteBaseUrl}${image}`;
  let html = baseHtml;
  html = replaceTag(html, /<title>.*?<\/title>/, `<title>${escapeAttr(title)}</title>`);
  html = replaceTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeAttr(description)}" />`);
  html = replaceTag(html, /<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${robots}" />`);
  html = replaceTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeAttr(title)}" />`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeAttr(description)}" />`);
  html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = replaceTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${socialImage}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeAttr(description)}" />`);
  html = replaceTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${socialImage}" />`);

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
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${staticPageMarkup({ title, heading, description, image, faqs, price, relatedSearches, sections, examples, kind })}</div>`,
  );

  if (!slug) {
    await writeFile(indexPath, html);
    return;
  }

  const pageDir = path.join(distDir, slug);
  await mkdir(pageDir, { recursive: true });
  await writeFile(path.join(pageDir, 'index.html'), html);
};

for (const page of routePages) {
  await writePrerenderedPage({ ...page, kind: page.slug === '' ? 'home' : 'page' });
}

for (const page of pages) {
  const url = `${siteBaseUrl}/${page.slug}`;
  const enhancement = pageEnhancements[page.slug] || {};
  await writePrerenderedPage({
    slug: page.slug,
    title: page.title,
    description: page.description,
    image: page.image,
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
    heading: page.productType,
    faqs: page.faqs,
    price: page.price,
    kind: 'product',
    ...enhancement,
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
  const enhancement = pageEnhancements[page.slug] || {};
  await writePrerenderedPage({
    slug: page.slug,
    title: page.title,
    description: page.description,
    image: page.image,
    heading: page.pageName,
    faqs: page.faqs,
    relatedSearches: page.relatedSearches,
    kind: 'product',
    ...enhancement,
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

const notFoundHtml = baseHtml
  .replace(/<title>.*?<\/title>/, '<title>Page Not Found | InstaPlaque</title>')
  .replace(/<meta name="description" content="[^"]*" \/>/, '<meta name="description" content="The requested InstaPlaque page could not be found." />')
  .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex,follow" />')
  .replace(/<link rel="canonical" href="[^"]*" \/>/, '<link rel="canonical" href="https://instaplaque.co.uk/404" />')
  .replace(
    '<div id="root"></div>',
    '<div id="root"><main class="seo-prerendered-page" data-prerendered="true"><article><h1>Page not found</h1><p>The page you requested does not exist. Choose a plaque category or return home.</p><p><a href="/">Return to InstaPlaque</a> · <a href="/custom-plaques">View custom plaques</a> · <a href="/design">Start a free proof</a></p></article></main></div>',
  );
await writeFile(path.join(distDir, '404.html'), notFoundHtml);

const merchantFeedSlugs = new Set(['memorial-plaques', 'bench-plaques', 'brass-plaques', 'stainless-steel-plaques']);
const merchantFeedPages = pages.filter((page) => merchantFeedSlugs.has(page.slug));

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
