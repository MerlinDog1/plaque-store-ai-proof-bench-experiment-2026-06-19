import type { SeoLandingPage } from './commerce';
import { Material, Shape } from '../types';
import { productionTiming } from './shopInformation';

// Stage 3: the four 31 October drafts, shortened for the live products-first template.
// No new products, prices or photographs. Metadata and FAQs are shared by React and prerendering.
const steelFrom = { width: 150, height: 50, material: Material.BrushedSteel, shape: Shape.Rect };
const brassFrom = { ...steelFrom, material: Material.BrushedBrass };
const timing = (question: string) => ({ question, answer: productionTiming.faq });

export const occasionLandingPages: SeoLandingPage[] = [
  {
    slug: 'house-name-plaques', title: 'House name plaques', shortTitle: 'House name plaques', eyebrow: 'Engraved house names',
    description: 'Engraved brass and stainless steel name plates for a door, porch or gate.',
    seoTitle: 'House Name Plaques & House Signs | Engraved Brass & Steel',
    seoDescription: 'Create an engraved house name plaque or house sign in brass or stainless steel. Compare sizes, finishes and prices, with a free proof and UK delivery included.',
    heroCopy: 'A house name, a number or a short second line, engraved in solid brass or stainless steel. Measure the flat fixing area and check the layout in your free proof.',
    image: '/site-images/studio-photo/polished-brass-200x150-rect-plaque.webp',
    relatedProductSlug: 'brushed-stainless-150x50-rect-plaque', from: steelFrom, proofCta: 'Design a house name plaque',
    sections: [
      { title: 'Keep the name easy to read', copy: 'These are engraved house signs and name plates for a door, porch, gate or wall. Check a paper outline in position before choosing a size. Leave more space for a long name, a house number or a second line.' },
      { title: 'Choose for the position', copy: 'Use metal without wood backing in an exposed spot. Brushed and polished brass mellow outdoors unless polished from time to time; stainless steel keeps its silver colour. Light solid wood or dark solid wood backing suits indoors or a sheltered porch. Near the sea, ask us about the finish first.' },
    ],
    faqs: [
      { question: 'Can I put my house name and number on one plaque?', answer: 'Yes. Add your own wording and check the layout in the free proof. A short name can suit a small strip; choose a larger plate if the name and number need more room.' },
      { question: 'Can a house name plaque go outside?', answer: 'Yes. Our brass and stainless steel plates without wood backing are made for outdoor use. Brass changes in appearance with time. For an exposed or coastal position, ask us about the finish before ordering.' },
      { question: 'Do I need a wood backing?', answer: 'No. A metal plate can be fixed directly to a suitable surface. Light solid wood or dark solid wood backing is optional on suitable sizes and is best indoors or in a sheltered spot.' },
      { question: 'What fixings come with a house name plaque?', answer: 'Standard fixings are included. Small strips have two screw holes; the larger rectangles and ovals shown have decorative caps over the screw heads. Your proof shows the fixing positions. Tell us the mounting surface if you need advice.' },
      { question: 'Can I check the house name before I pay?', answer: 'Yes. Design online or send your words on WhatsApp for a free proof. Check every letter, the dimensions, finish and fixing positions before approving it.' },
      timing('How long does a house name plaque take?'),
    ],
    relatedSearches: ['house name plaques', 'brass house name plate', 'engraved house name plaques'],
  },
  {
    slug: 'donor-recognition-plaques', title: 'Donor and recognition plaques', shortTitle: 'Donor plaques', eyebrow: 'Donors and sponsors',
    description: 'Individual engraved plaques for donors, sponsors and community dedications.',
    seoTitle: 'Donor Plaques UK | Brass Donor & Recognition Plaques',
    seoDescription: 'Thank donors and sponsors with an engraved brass or stainless steel plaque. Sizes for individual donor wall plates and dedications, with a free proof first.',
    heroCopy: 'An individual name plate for a donor wall, or a larger dedication for the project your supporters helped make possible. Agree the names and acknowledgement before approving your proof.',
    image: '/site-images/studio-photo/brushed-brass-300x200-rect-light-wood-plaque.webp',
    relatedProductSlug: 'brushed-stainless-150x50-rect-plaque', from: steelFrom, proofCta: 'Design a donor plaque',
    sections: [
      { title: 'Individual plates, or a shared dedication', copy: 'We make engraved plates, not a complete modular donor-wall system. For several plaques, agree a size, finish, border and fixing pattern first. Send the names and a photo or measurements of the existing wall or board so we can discuss the fit.' },
      { title: 'Agree the acknowledgement', copy: 'Check each donor’s name and each organisation’s preferred wording with the project organiser. If more names will be added later, plan that space with whoever manages the wall. An older finish may not match a new plaque exactly.' },
    ],
    faqs: [
      { question: 'Do you supply complete donor walls?', answer: 'This page is for individual engraved plaques, including plates for an existing donor wall or board. For several plaques, send us the sizes, wording and mounting details before you order.' },
      { question: 'Can several donors be named on one plaque?', answer: 'Yes. A4 and 400 × 300 mm plates give a list of names more room than a small name plate. Check the full list in the proof and choose a larger size if the lettering looks crowded.' },
      { question: 'Can you match an existing donor plaque?', answer: 'Send a photo, dimensions and the fixing positions on WhatsApp. We can discuss the closest size and finish, but cannot promise an exact match to an older plaque.' },
      { question: 'Can a plaque include a sponsor’s logo?', answer: 'Send the approved logo artwork on WhatsApp so we can check it for engraving and prepare a free proof with an exact price.' },
      { question: 'Can our team approve the wording together?', answer: 'Yes. Download the free PDF proof and share it with the organiser and donors. Check names, dates, dimensions and fixing positions, then agree one final version before payment.' },
      timing('How long does a donor plaque take?'),
    ],
    relatedSearches: ['brass donor plaques', 'donor wall plaques', 'donor recognition plaques', 'sponsor plaques'],
  },
  {
    slug: 'church-plaques', title: 'Church plaques', shortTitle: 'Church plaques', eyebrow: 'Pew plates and dedications',
    description: 'Engraved pew plates and dedication plaques, made to the wording and details agreed with your church.',
    seoTitle: 'Church Plaques | Brass Pew, Memorial & Dedication Plaques',
    seoDescription: 'Plan a church pew, memorial or dedication plaque in brass or steel. Compare sizes and wording ideas, check church permission, then approve your free proof.',
    heroCopy: 'Small plates for a pew and larger plaques for an agreed church dedication. Settle the location, wording, material and fixings with the church before ordering.',
    image: '/site-images/studio-photo/polished-brass-200x150-rect-light-wood-plaque.webp',
    relatedProductSlug: 'brushed-stainless-150x50-rect-plaque', from: steelFrom, proofCta: 'Design a church plaque',
    sections: [
      { title: 'Start with the church', copy: 'Ask whoever is responsible for the building which permission is needed for your proposed plaque. For a Church of England church, speak to the parish or Diocesan Advisory Committee. A design proof is not permission to install a plaque.' },
      { title: 'Measure the agreed fixing area', copy: 'Use the flat area, not the full width of a curved pew end. Keep the wording exactly as agreed, with every name and date checked. Do not drill into a pew or church wall until the church has approved the method and location.' },
    ],
    faqs: [
      { question: 'Do I need church permission before ordering?', answer: 'Ask your church first. It needs to agree the location, wording, material and method of fixing. For Church of England churches, the parish or Diocesan Advisory Committee can advise on permissions. A free proof is not permission to install.' },
      { question: 'What size should a pew plaque be?', answer: 'Measure the flat area and check the size permitted by your church. A 150 × 50 mm strip suits a short inscription; 225 × 65 mm or 225 × 75 mm gives a dedication more space. These are catalogue options, not church-approved sizes.' },
      { question: 'Can I share the proof with the parish?', answer: 'Yes. Download the free PDF proof to share the wording, dimensions, finish and fixing positions. Agree any changes before approving the plaque for production.' },
      { question: 'What fixings come with a church plaque?', answer: 'Standard fixings are included. The small strips have two screw holes; the larger rectangular plaques shown have decorative caps over the screw heads. The church must agree how and where the plaque is attached.' },
      { question: 'Which material should I choose?', answer: 'Brass has a warm finish; stainless steel is silver. Check the church’s agreed material first. Light solid wood or dark solid wood backing is available on suitable sizes for indoor or sheltered positions; use metal without backing for an exposed spot.' },
      timing('How long does a church plaque take?'),
    ],
    relatedSearches: ['church pew plaques', 'church dedication plaques', 'church memorial plaques'],
  },
  {
    slug: 'professional-brass-plaques', title: 'Brass practice plaques', shortTitle: 'Practice plaques', eyebrow: 'Professional practice name plates',
    description: 'Brass name plates for solicitors, dentists, vets, architects, accountants and other practices.',
    seoTitle: 'Brass Plaques for Professional Practices | InstaPlaque',
    seoDescription: 'Brass name plates for solicitors, dentists, vets, architects and accountants. Compare sizes and finishes, add your wording and approve a free proof first.',
    heroCopy: 'An engraved brass name plate for a practice entrance, reception or office door. Use your approved business name and check the titles, qualifications and contact details before approving your proof.',
    image: '/site-images/studio-photo/orbital-brass-matt-lacquer-200x150-rect-dark-wood-plaque.webp',
    relatedProductSlug: 'brushed-brass-150x50-rect-plaque', from: brassFrom, proofCta: 'Design a practice name plate',
    sections: [
      { title: 'Keep the practice name clear', copy: 'Put the approved name first, followed by a short description or appointment instruction. A small strip can name an office; A5 or A4 gives several lines more room. Check a paper outline on the door or wall before choosing.' },
      { title: 'Check professional wording before engraving', copy: 'For solicitors, dentists, vets, architects, accountants and other practices, check names, titles, registration numbers and professional marks with whoever is responsible for the practice. We make the plate to your wording; a name plate should not be assumed to fulfil a regulator’s display requirements.' },
    ],
    faqs: [
      { question: 'What size suits a practice name plate?', answer: 'A 150 × 50 mm strip suits a name on an office door. A5 or 200 × 150 mm gives a practice name and a short line more space; A4 suits several lines. Check the lettering and dimensions in your free proof.' },
      { question: 'Which brass finish should I choose?', answer: 'Polished brass is bright and reflective; brushed brass has a softer lined surface. Orbital brass has a random brushed pattern with matt lacquer. Aged brass has a hand-applied patina, sealed with matt lacquer. See the finishes below, or send a photo of the entrance for advice.' },
      { question: 'Can you include a practice logo?', answer: 'Send your approved logo on WhatsApp so we can check it for engraving and send a free proof with an exact price.' },
      { question: 'Can I include qualifications or a registration number?', answer: 'Yes. Supply the exact details and check that you are entitled to display them. Check spelling, numbers, titles and permissions before approving the free proof.' },
      { question: 'Does a plaque meet a regulator’s display requirements?', answer: 'Not automatically. We supply an engraved name plate to your approved wording, not a compliance certificate or prescribed notice. Check the current requirements with your regulator and the person responsible for your practice.' },
      timing('How long does a brass practice plaque take?'),
    ],
    relatedSearches: ['professional brass plaques', 'solicitor brass plaques', 'dentist brass name plates', 'veterinary practice plaques'],
  },
];
