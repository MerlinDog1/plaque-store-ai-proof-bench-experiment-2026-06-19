// The promo film's facts in one place (owner msgs 6954, 6977, 6986 and 6988, 28 Oct 2026): the players on the homepage
// and category pages, the /video watch page, its VideoObject structured data, the video sitemap entry and the checks all
// read them, so the title, description, thumbnail and file URLs can't drift apart (Google asks for the same thumbnail and
// matching descriptions across every source). The film itself is the Remotion project in
// projects/instaplaque-promo-video-20261028; docs/promo-video-2026-10-28.md has the details.

/** Google shows a video in results only from a watch page, one whose main purpose is that video, so it has its own. */
export const promoVideoPath = '/video';

export const promoVideo = {
  name: 'Design your plaque in seconds',
  // Shown on the watch page, and used as its meta description, the VideoObject description and the sitemap entry.
  description: 'See how to design a plaque with InstaPlaque in 22 seconds. Type your words into our online designer and our AI lays them out on the plaque, then swap between four metal finishes. Or send your words on WhatsApp and we’ll design it for you, with a free PDF proof and a link to order.',
  // The film's own qualifications, as on screen. The rule is services/productionTime.mjs (owner msg 6947).
  disclosure: 'The layout step is sped up: real layouts take about 30–60 seconds. The WhatsApp chat is an example.',
  footnote: '*Most plaques up to 600 × 400 mm: estimated production time after proof approval and payment, plus delivery. Aged brass 7 and wood-backed plaques 10–15 working days.',
  file: '/videos/instaplaque-design-in-seconds-20261028.mp4',
  // The player's poster: the film's own frame at 1 s, 4:5 like the player.
  poster: '/videos/instaplaque-design-in-seconds-20261028-poster.webp',
  // Search thumbnails: the same frame on its own blurred background, in the three shapes Google asks for. The 16:9 one
  // is also the sitemap thumbnail and the watch page's share image.
  thumbnails: {
    wide: '/videos/instaplaque-design-in-seconds-20261028-16x9.jpg',
    standard: '/videos/instaplaque-design-in-seconds-20261028-4x3.jpg',
    square: '/videos/instaplaque-design-in-seconds-20261028-1x1.jpg',
  },
  width: 720,
  height: 900,
  seconds: 22, // 21.93 s
  // First published on instaplaque.co.uk (the 28 Oct release, dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy).
  uploadDate: '2026-10-28T08:30:13+00:00',
};

/** What the silent film shows, in order: the watch page's written version (WCAG 1.2.1) and the VideoObject transcript. */
export const promoVideoMoments = [
  {
    seconds: 0,
    heading: 'Design your plaque in seconds',
    text: 'A polished brass plaque on a garden bench: “Peter John Wilson, 1948–2023. Please sit awhile, enjoy the view, and remember him with a smile.” Made in 5 working days*.',
  },
  {
    seconds: 2,
    heading: 'Just type your words',
    text: 'Our online designer on a phone. “In loving memory of Arthur Bell 1932 – 2023 Forever in our hearts” is typed as a single line, then “Design my plaque” is tapped.',
  },
  {
    seconds: 5,
    heading: 'AI lays it out for you',
    text: 'Our AI checks the spelling, then designs the layout, with its progress shown on the plaque. Sped up: real layouts take about 30–60 seconds.',
  },
  {
    seconds: 7,
    heading: 'See it before you buy',
    text: 'The finished layout on polished brass, laid out by our AI in 27 seconds: “In loving memory of”, then “Arthur Bell” in larger letters, “1932 – 2023” and “Forever in our hearts”.',
  },
  {
    seconds: 9,
    heading: 'Swap the finish instantly',
    text: 'The same plaque in polished brass, brushed stainless steel, aged brass and brushed brass.',
  },
  {
    seconds: 11,
    heading: 'Or we’ll design it for you on WhatsApp',
    text: 'An example chat. The customer writes “Hi InstaPlaque, I’m interested in a plaque”, then “It’s for Mum’s garden. Could it say ‘In loving memory of Margaret Rose, 1941 – 2024. Forever blooming in our garden’? Maybe roses round the edge?” We reply “What a lovely idea. Here’s your free proof” with the proof as a PDF, then a link to order it. The customer replies “That’s perfect. Mum would have loved it.”',
  },
  {
    seconds: 19,
    heading: 'Design yours free',
    text: 'InstaPlaque: personal words, made lasting. instaplaque.co.uk, WhatsApp 07464 843841. Free online proof, UK delivery included, made in 5 working days*.',
  },
];

export const promoVideoTime = (seconds) => `0:${String(seconds).padStart(2, '0')}`;

export const promoVideoTranscript = () => [
  ...promoVideoMoments.map(moment => `${promoVideoTime(moment.seconds)} ${moment.heading}. ${moment.text}`),
  promoVideo.footnote,
].join('\n');

/** schema.org VideoObject for the watch page, with everything Google uses for video results. */
export const promoVideoObject = (site) => ({
  '@type': 'VideoObject',
  '@id': `${site}${promoVideoPath}#video`,
  name: promoVideo.name,
  description: `${promoVideo.description} ${promoVideo.disclosure}`,
  thumbnailUrl: [promoVideo.thumbnails.wide, promoVideo.thumbnails.standard, promoVideo.thumbnails.square, promoVideo.poster].map(path => site + path),
  uploadDate: promoVideo.uploadDate,
  duration: `PT${promoVideo.seconds}S`,
  contentUrl: site + promoVideo.file,
  encodingFormat: 'video/mp4',
  inLanguage: 'en-GB',
  isFamilyFriendly: true,
  creator: { '@type': 'Organization', '@id': `${site}/#organization`, name: 'InstaPlaque', url: `${site}/` },
  publisher: { '@id': `${site}/#organization` },
  transcript: promoVideoTranscript(),
});

const escapeXml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The watch page's entry in sitemap.xml, with Google's video sitemap tags. */
export const promoVideoSitemapEntry = (site) => `  <url>
    <loc>${site}${promoVideoPath}</loc>
    <lastmod>2026-10-28</lastmod>
    <video:video>
      <video:thumbnail_loc>${escapeXml(site + promoVideo.thumbnails.wide)}</video:thumbnail_loc>
      <video:title>${escapeXml(promoVideo.name)}</video:title>
      <video:description>${escapeXml(`${promoVideo.description} ${promoVideo.disclosure}`)}</video:description>
      <video:content_loc>${escapeXml(site + promoVideo.file)}</video:content_loc>
      <video:duration>${promoVideo.seconds}</video:duration>
      <video:publication_date>${promoVideo.uploadDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:live>no</video:live>
    </video:video>
  </url>`;
