// Only the interactive designer and proof exports need the inscription catalogue.
const stylesheet = "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alex+Brush&family=Allura&family=Bebas+Neue&family=Bitter:wght@400;700&family=Caveat:wght@400;700&family=Cinzel:wght@400;700;900&family=Dancing+Script:wght@400;700&family=EB+Garamond:wght@400;600;700&family=Great+Vibes&family=Lato:wght@300;400;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:wght@300;400;700&family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@300;400;600;700&family=Oswald:wght@400;600;700&family=Pacifico&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Raleway:wght@300;400;500;700&family=Roboto+Slab:wght@300;500;700&family=Satisfy&display=swap";
let pending: Promise<void> | undefined;
export function ensureInscriptionFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = stylesheet; link.id = 'inscription-fonts';
    const timer = window.setTimeout(() => { link.remove(); pending = undefined; reject(new Error('Inscription fonts took too long to load. Please retry.')); }, 20000);
    link.onload = () => { clearTimeout(timer); resolve(); };
    link.onerror = () => { clearTimeout(timer); link.remove(); pending = undefined; reject(new Error('Inscription fonts could not load. Please retry.')); };
    document.head.appendChild(link);
  });
  return pending;
}
