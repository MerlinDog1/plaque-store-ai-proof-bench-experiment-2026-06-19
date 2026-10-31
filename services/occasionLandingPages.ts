import type { SeoLandingPage } from './commerce';
import { Material, Shape } from '../types';

// Preview candidates, 31 October 2026. Copy is shared by React and prerendering; prices are never authored here.
// Existing catalogue imagery only: these are examples of the product, not claimed customer commissions.
export interface OccasionLanding extends SeoLandingPage {
  heroSlug: string;
  fromSlug: string;
  picks: string[];
  sizeSlugs: string[];
  sizeFits: string[];
  wording: Array<{ title: string; lines: string[] }>;
  related: Array<{ slug: string; label: string }>;
  sourceLinks?: Array<{ href: string; label: string }>;
}
const smallSteel = 'brushed-stainless-150x50-rect-plaque';
const smallBrass = 'brushed-brass-150x50-rect-plaque';
const steelFrom = { width: 150, height: 50, material: Material.BrushedSteel, shape: Shape.Rect };
const brassFrom = { ...steelFrom, material: Material.BrushedBrass };

export const occasionLandingPages: OccasionLanding[] = [
  {
    slug: 'house-name-plaques', title: 'House name plaques', shortTitle: 'House name plaques', eyebrow: 'Engraved house names',
    description: 'Simple engraved brass and stainless steel name plates for a door, porch or gate.',
    seoTitle: 'House Name Plaques | Engraved Brass & Steel | InstaPlaque',
    seoDescription: 'Create a simple engraved house name plaque in brass or stainless steel. Compare sizes, finishes and prices, with a free proof and UK delivery included.',
    heroNote: 'Your house name, simply engraved.',
    heroCopy: 'A small metal name plate for a door, porch or gate. Choose brass or stainless steel, add your house name and check a free proof before you pay.',
    image: '/site-images/catalogue-photo/polished-brass-200x150-rect-plaque.webp',
    heroSlug: 'polished-brass-200x150-rect-plaque', relatedProductSlug: 'polished-brass-200x150-rect-plaque',
    fromSlug: smallSteel, from: steelFrom, proofCta: 'Design a house name plaque',
    picks: [smallSteel, smallBrass, 'polished-brass-200x150-rect-plaque', 'aged-brass-250x150-oval-plaque'],
    sizeSlugs: [smallSteel, 'brushed-stainless-200x150-rect-plaque', 'a5-brushed-steel-personalised-plaque', 'brushed-stainless-250x150-oval-plaque'],
    sizeFits: ['A short name beside a door', 'A name on one or two lines', 'A name with a second line', 'A short name with curved ends'],
    sections: [
      { title: 'A name plate, not a whole frontage', copy: 'This page is for the engraved inscription plaques in our catalogue: a house name, perhaps with a number or a short second line. Measure the flat fixing area on the door, gate or wall before choosing a size. Check a paper outline in position and keep the wording easy to read.' },
      { title: 'Brass or stainless steel outside', copy: 'Brushed and polished brass mellow and darken outdoors unless polished from time to time. Stainless steel keeps its silver colour. Wood backing suits indoors or a sheltered spot; choose metal without backing for an exposed position. Near the sea or somewhere very exposed, ask us before ordering.' },
      { title: 'Fixings for your surface', copy: 'Small strip plates have two screw holes. The larger rectangles and oval shown here have decorative caps over the screw heads. Standard fixings are included; tell us what you are mounting to so we can check the arrangement. Your proof shows the fixing positions.' },
    ],
    faqs: [
      { question: 'Can I put my house name and number on one plaque?', answer: 'Yes. Use your own wording and check the layout in the free proof. A short name can suit a small strip; choose a larger plate if the name and number need more room.' },
      { question: 'Can a house name plaque go outside?', answer: 'Yes. Our brass and stainless steel plates without wood backing are made for outdoor use. Brass changes in appearance with time. For an exposed or coastal position, ask us about the finish before ordering.' },
      { question: 'Do I need a wood backing?', answer: 'No. A metal plate can be fixed directly to a suitable surface. Wood backing is optional on suitable sizes and is best indoors or in a sheltered spot such as a porch.' },
    ],
    wording: [
      { title: 'Just the name', lines: ['ROSE COTTAGE'] },
      { title: 'Name and number', lines: ['WILLOW HOUSE', '24'] },
      { title: 'A longer name', lines: ['THE OLD', 'SCHOOLHOUSE'] },
      { title: 'An entrance', lines: ['ORCHARD HOUSE', 'Please use the side gate'] },
    ],
    related: [{ slug: 'brass-plaques', label: 'Brass finishes' }, { slug: 'stainless-steel-plaques', label: 'Stainless steel plaques' }, { slug: 'plaque-sizes', label: 'Every size and price' }],
    relatedSearches: ['house name plaques', 'brass house name plate', 'engraved house name plaques'],
  },
  {
    slug: 'donor-recognition-plaques', title: 'Donor and recognition plaques', shortTitle: 'Donor plaques', eyebrow: 'Thank supporters in their own place',
    description: 'Individual engraved plaques for donors, sponsors and community dedications.',
    seoTitle: 'Donor & Recognition Plaques | Brass Sponsor Plaques | InstaPlaque',
    seoDescription: 'Thank donors and sponsors with an engraved brass or stainless steel plaque. Sizes for individual donor wall plates and dedications, with a free proof first.',
    heroNote: 'A lasting thank-you to the people who helped.',
    heroCopy: 'Recognise a donor, sponsor or group of supporters with an individual engraved plaque. Choose a small name plate for an existing donor wall, or a larger dedication for the project they helped make possible.',
    image: '/site-images/studio-photo/brushed-brass-300x200-rect-light-wood-plaque.webp',
    heroSlug: 'brushed-brass-300x200-rect-light-wood-plaque', relatedProductSlug: 'brushed-brass-300x200-rect-light-wood-plaque',
    fromSlug: smallSteel, from: steelFrom, proofCta: 'Design a donor plaque',
    picks: [smallBrass, 'brushed-stainless-200x50-rect-plaque', 'brushed-brass-300x200-rect-light-wood-plaque', 'brushed-brass-400x300-rect-plaque'],
    sizeSlugs: [smallSteel, 'a5-brushed-steel-personalised-plaque', 'brushed-stainless-297x210-rect-plaque', 'brushed-stainless-400x300-rect-plaque'],
    sizeFits: ['An individual supporter name', 'A donor and a short thank-you', 'A project dedication', 'Several names or a longer dedication'],
    sections: [
      { title: 'Individual plaques for a donor wall', copy: 'We make the engraved plates, not a complete modular donor-wall system. For a set of plaques, agree a size, finish, border and fixing pattern before starting. Send us the list of names and a photo or measurements of the existing board so we can discuss the fit; do not assume a new plate will match an older finish exactly.' },
      { title: 'Agree the acknowledgement first', copy: 'Check each person’s name and each organisation’s preferred wording with the project organiser. Decide whether to name a donor, the project or the occasion most prominently. If names will be added later, plan that space with whoever manages the wall.' },
      { title: 'Materials and backing', copy: 'Brass gives a warm finish; brushed stainless steel is silver. Aged brass has a sealed patina. Choose metal without backing for an exposed position. Light oak and dark wood backing are available on suitable sizes for indoor or sheltered display, priced separately in the catalogue.' },
      { title: 'Fixings and the host surface', copy: 'Small strips use two screw fixings; the larger plaques shown use decorative caps over their screw heads. Standard fixings are included. Check the wall or board dimensions and tell us the surface before ordering. Your proof shows the selected size and fixing positions.' },
    ],
    faqs: [
      { question: 'Do you supply complete donor walls?', answer: 'This page is for individual engraved plaques, including plates for an existing donor wall or board. For several plaques, send us the sizes, wording and mounting details so we can discuss the job before you order.' },
      { question: 'Can a plaque recognise a business sponsor?', answer: 'Yes. Supply the sponsor’s approved name and acknowledgement. For a logo, send the artwork on WhatsApp so we can check it and prepare a free proof with an exact price.' },
      { question: 'Can several donors be named on one plaque?', answer: 'Yes. A4 and 400 × 300 mm plates give a list of names more room than a small name plate. Check the full list in the proof and choose a larger size if the lettering looks crowded.' },
    ],
    wording: [
      { title: 'An individual donor', lines: ['With thanks to', 'THE MORGAN FAMILY'] },
      { title: 'A community project', lines: ['This garden was made possible', 'by the generosity of', 'our friends and supporters', '2026'] },
      { title: 'A sponsor', lines: ['Supported by', 'WILLOW & CO', 'With our grateful thanks'] },
      { title: 'A gift in memory', lines: ['Given in memory of', 'ANNE WALKER', 'by her family and friends'] },
    ],
    related: [{ slug: 'opening-plaques', label: 'Opening and dedication plaques' }, { slug: 'brass-plaques', label: 'Brass plaques' }, { slug: 'garden-plaques', label: 'Garden dedications' }, { slug: 'church-plaques', label: 'Church plaques' }],
    relatedSearches: ['brass donor plaques', 'donor wall plaques', 'donor recognition plaques', 'sponsor plaques'],
  },
  {
    slug: 'church-plaques', title: 'Church pew and dedication plaques', shortTitle: 'Church plaques', eyebrow: 'Church inscriptions and dedications',
    description: 'Engraved pew plates and dedication plaques, made to the wording and details agreed with your church.',
    seoTitle: 'Church Pew & Dedication Plaques | Engraved Metal | InstaPlaque',
    seoDescription: 'Plan a church pew, memorial or dedication plaque in brass or steel. Compare sizes and wording ideas, check church permission, then approve your free proof.',
    heroNote: 'A gift remembered. A dedication agreed.',
    heroCopy: 'Small plates for a pew and larger plaques for an agreed church dedication. Start with your parish’s permission and approved wording, then choose a size and finish and check a free proof.',
    image: '/site-images/studio-photo/polished-brass-210x148-rect-dark-wood-plaque.webp',
    heroSlug: 'polished-brass-210x148-rect-dark-wood-plaque', relatedProductSlug: 'polished-brass-210x148-rect-dark-wood-plaque',
    fromSlug: smallSteel, from: steelFrom, proofCta: 'Design a church plaque',
    picks: ['polished-brass-150x50-rect-plaque', 'brushed-brass-225x75-rect-plaque', 'polished-brass-210x148-rect-dark-wood-plaque', 'brushed-stainless-210x297-rect-plaque'],
    sizeSlugs: [smallSteel, 'brushed-stainless-225x75-rect-plaque', 'a5-brushed-steel-personalised-plaque', 'brushed-stainless-210x297-rect-plaque'],
    sizeFits: ['A short pew inscription', 'A name and a short dedication', 'A gift or memorial dedication', 'Longer dedication wording'],
    sections: [
      { title: 'Agree the location before designing', copy: 'Speak to the parish about the proposed location, wording, material and method of fixing before ordering. The Church of England’s faculty system covers church buildings, their contents and churchyards. Its national guidance says most works need a faculty. Ask the parish or Diocesan Advisory Committee which permission is needed for your particular plaque, and do not begin installation before permission is granted.' },
      { title: 'Memorial plaques may be restricted', copy: 'Individual dioceses publish their own guidance. Chester, for example, says a faculty is always needed to introduce a memorial plaque into a church, applies an exceptional-case test and strongly discourages small memorial plaques on furniture. This is Chester’s guidance, not a promise that another diocese permits the same proposal. Buying a plaque does not guarantee permission.' },
      { title: 'Measure a pew carefully', copy: 'Use the flat fixing area, not the full width of a curved pew end. The small strip plates shown have two screw holes; choose a size and fixing position agreed by the church. Do not drill into a pew or church wall before permission has been settled.' },
      { title: 'A plaque for an agreed gift or dedication', copy: 'A5 gives a name and short dedication more room. A4 portrait suits several short lines. Keep the wording exactly as agreed by the parish, with names and dates checked, and share the dimensioned proof before approving production.' },
      { title: 'Materials, backing and fixings', copy: 'Brass gives a traditional warm finish; stainless steel is silver. Oak or dark wood backing is available on suitable sizes for indoor or sheltered positions. The larger plaques shown have decorative fixing caps. Standard fixings are included, but the church must agree how and where the plaque is attached.' },
    ],
    faqs: [
      { question: 'Do I need church permission before ordering?', answer: 'Ask your parish first. In Church of England churches, the faculty system covers changes to buildings and their contents. The parish or Diocesan Advisory Committee can advise on the permission needed for the proposed plaque. Other churches have their own approval arrangements; a free design proof is not permission to install.' },
      { question: 'What size should a pew plaque be?', answer: 'Measure the flat area and check the size permitted by your church. A 150 × 50 mm strip suits a short inscription; 225 × 75 mm gives a dedication more space. These are catalogue options, not church-approved sizes.' },
      { question: 'Can I share the proof with the parish?', answer: 'Yes. Download the free proof PDF to share the wording, dimensions, finish and fixing positions. Agree any changes before approving the plaque for production.' },
    ],
    wording: [
      { title: 'In memory', lines: ['In loving memory of', 'MARGARET HUGHES', '1931–2024'] },
      { title: 'A pew given', lines: ['This pew was given by', 'the Taylor family', 'in thanksgiving'] },
      { title: 'A dedication', lines: ['To the glory of God', 'and in grateful memory of', 'JOHN MORGAN'] },
      { title: 'An anniversary gift', lines: ['Given by the congregation', 'in thanksgiving for', 'fifty years of worship', '1976–2026'] },
    ],
    related: [{ slug: 'memorial-plaques', label: 'Memorial plaques' }, { slug: 'bench-plaques', label: 'Small bench plates' }, { slug: 'donor-recognition-plaques', label: 'Donor acknowledgements' }, { slug: 'opening-plaques', label: 'Opening plaques' }],
    sourceLinks: [
      { href: 'https://www.churchofengland.org/resources/churchcare/making-changes-your-building-and-churchyard/talk-your-dac-about-permissions', label: 'Church of England permissions' },
      { href: 'https://www.chesterdiocese.org/content/plaques-', label: 'Chester memorial plaque guidance' },
      { href: 'https://www.chesterdiocese.org/_files/ugd/519181_eb20dfb7b4804a7a8df26129dae550ba.pdf', label: 'Chester memorial tablet guidance (PDF)' },
    ],
    relatedSearches: ['church pew plaques', 'church dedication plaques', 'church memorial plaques'],
  },
  {
    slug: 'professional-brass-plaques', title: 'Brass plaques for professional practices', shortTitle: 'Professional practice plaques', eyebrow: 'Engraved practice name plates',
    description: 'Brass practice name plates for solicitors, dentists, vets, architects, accountants and similar offices.',
    seoTitle: 'Brass Plaques for Professional Practices | InstaPlaque',
    seoDescription: 'Brass name plates for solicitors, dentists, vets, architects and accountants. Compare sizes and finishes, add your wording and approve a free proof before paying.',
    heroNote: 'Your practice name, clearly presented.',
    heroCopy: 'An engraved brass name plate for a practice entrance, reception or office door. Start with your approved business name, add only the titles and details you are entitled to use, and check the layout before it is made.',
    image: '/site-images/studio-photo/brushed-brass-300x200-rect-light-wood-plaque.webp',
    heroSlug: 'brushed-brass-300x200-rect-light-wood-plaque', relatedProductSlug: 'brushed-brass-300x200-rect-light-wood-plaque',
    fromSlug: smallBrass, from: brassFrom, proofCta: 'Design a practice name plate',
    picks: [smallBrass, 'polished-brass-200x150-rect-plaque', 'brushed-brass-210x148-rect-light-wood-plaque', 'orbital-brass-matt-lacquer-297x210-rect-plaque'],
    sizeSlugs: [smallBrass, 'brushed-brass-200x150-rect-plaque', 'brushed-brass-210x148-rect-plaque', 'brushed-brass-297x210-rect-plaque'],
    sizeFits: ['A name on an office door', 'A practice name and short line', 'Names and appointment details', 'A practice name with several lines'],
    sections: [
      { title: 'Solicitors and legal practices', copy: 'Put the firm’s approved name first, then a short description or appointment instruction. SRA Transparency Rule 4 specifies disclosures on websites, letterheads and emails; those provisions do not establish a requirement for an entrance plaque. Check proposed regulatory wording with the person responsible for compliance before engraving it.' },
      { title: 'Dentists and dental practices', copy: 'GDC Standards 6.6.10–11 say you should display team information, including registration numbers where appropriate, and information about GDC regulation and the nine principles where patients can easily see it. GDC advertising guidance also says named registrants must include their registration number in publicity information. Check the guidance for your proposed wording; a simple name plate should not be assumed to fulfil it.' },
      { title: 'Vets and veterinary practices', copy: 'RCVS guidance treats practice names as advertising. Keep names and professional descriptions accurate, and use titles such as Specialist or Advanced Practitioner only when appropriately registered or listed with the RCVS. Check the current guidance before approving your wording.' },
      { title: 'Architects and design studios', copy: 'Use the title architect only when entitled to do so. Keep the name plate to the approved studio name and a short description; check the proposed wording and any professional marks before ordering.' },
      { title: 'Accountants and other practices', copy: 'Use the business name and a short, accurate description of the work. Check entitlement before using a chartered title, membership letters or a professional body’s logo. You do not need to put every service on the entrance plate.' },
      { title: 'Sizes, finishes and fixings', copy: 'A small strip can name an office; A5 or A4 gives a practice name and several details more room. Brushed, polished, orbital and aged brass are available. Small strips have screw fixings; larger plaques shown use decorative caps. Wood backing suits indoor or sheltered use. Check the wall surface and permission to fix a sign before ordering.' },
    ],
    faqs: [
      { question: 'Does a practice plaque meet a regulator’s display requirements?', answer: 'Not automatically. We supply an engraved name plate to your approved wording, not a compliance certificate or prescribed notice. Check the current rules with your regulator and the person responsible for your practice before ordering.' },
      { question: 'Can I include qualifications or a registration number?', answer: 'Yes, if you supply the exact details and are entitled to display them. Check spelling, numbers, titles and permissions yourself; the free proof lets you review their layout before payment.' },
      { question: 'Can you include a practice logo?', answer: 'Send your logo on WhatsApp so we can check it for engraving and send a free proof with an exact price. Use only artwork and professional marks you have permission to display.' },
    ],
    wording: [
      { title: 'Solicitors', lines: ['[APPROVED FIRM NAME]', 'Solicitors', 'By appointment'] },
      { title: 'Dental practice', lines: ['[PRACTICE NAME]', 'Dental Practice', 'Reception →'] },
      { title: 'Veterinary practice', lines: ['[PRACTICE NAME]', 'Veterinary Surgery'] },
      { title: 'Architects', lines: ['[APPROVED STUDIO NAME]', 'Architects', 'By appointment'] },
      { title: 'Accountants', lines: ['[BUSINESS NAME]', 'Accountants', 'Please ring the bell'] },
    ],
    related: [{ slug: 'brass-plaques', label: 'All brass finishes' }, { slug: 'stainless-steel-plaques', label: 'Stainless steel alternatives' }, { slug: 'opening-plaques', label: 'Practice opening plaques' }, { slug: 'plaque-sizes', label: 'Every size and price' }],
    sourceLinks: [
      { href: 'https://www.sra.org.uk/solicitors/standards-regulations/transparency-rules/', label: 'SRA Transparency Rules' },
      { href: 'https://standards.gdc-uk.org/pages/principle6/principle6', label: 'GDC Principle 6' },
      { href: 'https://www.gdc-uk.org/standards-guidance/standards-and-guidance/gdc-guidance-for-dental-professionals/guidance-on-advertising', label: 'GDC advertising guidance' },
      { href: 'https://www.rcvs.org.uk/veterinary-professionals/conduct-and-guidance/supporting-guidance/23-protection-of-title-advertising-and-endorsement', label: 'RCVS titles and advertising' },
      { href: 'https://arb.org.uk/architect-information/using-title-architect-within-company-name/', label: 'ARB company names' },
    ],
    relatedSearches: ['brass plaques for professional practices', 'solicitors brass plaque', 'dental practice brass plate', 'veterinary practice name plate'],
  },
];
