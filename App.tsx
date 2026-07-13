import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import PlaquePreview from './components/PlaquePreview';
import { Controls } from './components/Controls';
import { RealisticPreviewModal } from './components/RealisticPreviewModal';
import { SiteExperience } from './components/SiteExperience';
import { BorderStyle, DesignStyle, EtchmasterImageMode, EtchmasterShapeMask, Fixing, INITIAL_STATE, Material, MemorialImageMethod, MemorialImagePlacement, MemorialImageShape, PlaqueState, Shape, TextColor, TypographyEngine } from './types';
import { generatePlaqueDesign, generateRealisticView, refinePlaqueWording, GenerationPhase } from './services/geminiService';
import { downloadCorelSvg, downloadPdf, svgToPngBase64, svgToProofPngBase64 } from './services/exportService';
import { getInscriptionLayout } from './services/inscriptionLayout';
import { estimatePlaquePrice } from './services/pricing';
import { DEFAULT_PRODUCT_SLUG, DeliveryAddress, MockOrder, ProductFamily, SiteView, getLandingPageBySlug, getPlaqueSummaryTitle, getProductBySlug, makeMockOrder, productFamilies, seoLandingPages } from './services/commerce';
import { isBenchPlaqueFormat } from './services/plaqueRules';
import { BENCH_SAFE_MARGIN_PERCENT } from './services/safeMargin';

const ThreePlaquePreview = lazy(async () => {
  const module = await import('./components/ThreePlaquePreview');
  return { default: module.ThreePlaquePreview };
});

const SUPPORTED_MEMORIAL_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const DELIVERY_HELP = 'UK mainland only. Highlands, islands and non-UK delivery may incur extra charges.';

const DESIGNER_GUIDE_GALLERY = [
  {
    src: '/site-images/home-gallery-brass-bench.webp',
    alt: 'Engraved polished brass memorial plaque fitted to a wooden park bench',
    title: 'Classic brass bench plaque',
    type: 'Bench',
    note: 'A compact 150 × 50 mm format with four screw fixings and concise memorial wording.',
  },
  {
    src: '/site-images/home-gallery-aged-brass-wood.webp',
    alt: 'Aged brass memorial plaque mounted on a dark wooden backing board',
    title: 'Aged brass on wood',
    type: 'Memorial',
    note: 'A warm aged-brass finish paired with a shaped timber backing for a more substantial display.',
  },
  {
    src: '/site-images/home-gallery-oval-steel.webp',
    alt: 'Oval stainless steel engraved wall plaque with a polished silver finish',
    title: 'Oval stainless steel',
    type: 'Custom',
    note: 'An oval silver plaque with a restrained border, corner-free shape and centred inscription.',
  },
  {
    src: '/site-images/home-gallery-brass-community.webp',
    alt: 'Large engraved brass community and commemorative wall plaque',
    title: 'Community plaque',
    type: 'Commemorative',
    note: 'A larger plaque gives names, roles, dates and a dedication enough room to remain legible.',
  },
  {
    src: '/site-images/home-carousel-garden-brass.webp',
    alt: 'Small engraved brass plaque displayed outdoors in a garden setting',
    title: 'Garden brass plaque',
    type: 'Garden',
    note: 'Brass provides a traditional outdoor finish; choose fixings to suit timber, masonry or a post.',
  },
  {
    src: '/site-images/home-carousel-steel-wall.webp',
    alt: 'Brushed stainless steel engraved plaque fixed to an exterior wall',
    title: 'Steel wall plaque',
    type: 'House & wall',
    note: 'Brushed stainless steel creates a clean contemporary look and is suitable for exterior use.',
  },
] as const;

const DESIGNER_GUIDE_STEPS = [
  {
    title: 'Choose a size and shape',
    copy: 'Start with where the plaque will be fitted and how much wording it needs. The proof always keeps the real plaque proportions.',
    example: 'A short bench dedication usually suits 150 × 50 mm; a longer opening inscription often needs A4.',
  },
  {
    title: 'Choose the material',
    copy: 'Pick warm traditional brass, aged brass, or contemporary stainless steel. The preview and price update with your choice.',
    example: 'Brass is popular on timber benches; brushed steel works well on modern walls and signs.',
  },
  {
    title: 'Set the engraving colour',
    copy: 'Choose the colour used in the engraved areas so the wording has the contrast and character you want.',
    example: 'Black gives crisp contrast on brass and steel; softer colours can suit decorative or commemorative designs.',
  },
  {
    title: 'Add fixings and a border',
    copy: 'Select holes, decorative caps or no visible fixings, then add a border if it helps frame the inscription.',
    example: 'A bench plaque normally uses four holes; an indoor presentation plaque may use hidden mounting instead.',
  },
  {
    title: 'Add a wood backing if needed',
    copy: 'A shaped timber backing is optional. You can compare the plaque alone with the complete mounted appearance.',
    example: 'Aged brass on dark wood creates a traditional memorial display; a bench plaque normally needs no backing.',
  },
  {
    title: 'Enter the wording and create the layout',
    copy: 'Type the exact inscription and add any layout guidance. The designer arranges the hierarchy, spacing and line breaks for the chosen size.',
    example: 'Try: “In loving memory of / Jane Smith / 1948–2025 / Forever in our hearts”. Always check names and dates carefully.',
  },
  {
    title: 'Review the proof and price',
    copy: 'Inspect the finished 2D proof, use 3D to check thickness and materials, then revise any earlier step before ordering.',
    example: 'Nothing goes to manufacture until you approve the design and complete checkout. Designing and revising are free.',
  },
] as const;

const PROOF_BENCH_INITIAL_STATE: PlaqueState = {
  ...INITIAL_STATE,
  width: 297,
  height: 210,
  material: Material.BrushedSteel,
  textColor: TextColor.Black,
  reverseEtch: false,
  border: false,
  borderStyle: BorderStyle.Single,
  fixing: Fixing.None,
  fixingHoleCount: 4,
  capSize: 10,
  cornerRadius: 0,
  generatedSvgContent: null,
  aiReasoning: null,
  typographyEngine: TypographyEngine.GeminiAuthored,
};

const routeViews: Partial<Record<string, SiteView>> = {
  '/': 'plaque',
  '/materials': 'materials',
  '/how-it-works': 'how',
  '/faq': 'faq',
  '/quote': 'quote',
  '/contact': 'contact',
  '/checkout': 'checkout',
  '/order-confirmed': 'order-confirmed',
  '/admin': 'admin',
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/cookies': 'cookies',
  '/returns': 'returns',
  '/returns-and-cancellations': 'returns',
  '/returns-cancellations': 'returns',
  '/design': 'plaque',
};

const viewRoutes: Partial<Record<SiteView, string>> = {
  home: '/',
  materials: '/materials',
  how: '/how-it-works',
  faq: '/faq',
  quote: '/quote',
  contact: '/contact',
  checkout: '/checkout',
  'order-confirmed': '/order-confirmed',
  admin: '/admin',
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  returns: '/returns-cancellations',
  plaque: '/',
};

const productRouteSlugs = new Set(productFamilies.map((product) => product.slug));
const landingRouteSlugs = new Set(seoLandingPages.map((page) => page.slug));

const getProductSlugFromPath = (pathname: string) => {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return productRouteSlugs.has(slug) ? slug : null;
};

const getLandingSlugFromPath = (pathname: string) => {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return landingRouteSlugs.has(slug) ? slug : null;
};

const getInitialView = (): SiteView => {
  if (typeof window === 'undefined') return 'home';
  if (getProductSlugFromPath(window.location.pathname)) return 'product';
  if (getLandingSlugFromPath(window.location.pathname)) return 'landing';
  return routeViews[window.location.pathname] ?? 'home';
};

const getInitialProductSlug = () => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCT_SLUG;
  return getProductSlugFromPath(window.location.pathname) ?? DEFAULT_PRODUCT_SLUG;
};

const getInitialLandingSlug = () => {
  if (typeof window === 'undefined') return seoLandingPages[0]?.slug || '';
  return getLandingSlugFromPath(window.location.pathname) ?? seoLandingPages[0]?.slug ?? '';
};

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read the uploaded image.'));
  reader.readAsDataURL(file);
});

const convertImageDataUrlToPng = (dataUrl: string): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not prepare a canvas for this image.'));
      return;
    }
    ctx.drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  img.onerror = () => reject(new Error('This browser could not decode the AVIF image.'));
  img.src = dataUrl;
});

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out.`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

const fireAndForget = (promise: Promise<unknown>, onError: (error: unknown) => void) => {
  promise.catch(onError);
};

async function prepareMemorialImageUpload(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  return file.type === 'image/avif' ? convertImageDataUrlToPng(dataUrl) : dataUrl;
}

const makeLayoutSignature = (prompt: string, proofState: PlaqueState, guidance = '') => JSON.stringify({
  prompt: prompt.trim(),
  guidance: guidance.trim(),
  width: proofState.width,
  height: proofState.height,
  shape: proofState.shape,
  designStyle: proofState.designStyle,
  memorialImageEnabled: proofState.memorialImageEnabled,
  memorialImageMethod: proofState.memorialImageMethod,
  memorialImagePlacement: proofState.memorialImagePlacement,
  memorialImageShape: proofState.memorialImageShape,
  memorialImageScale: proofState.memorialImageScale,
  safeMargin: proofState.safeMargin,
});

type GeneratedProofFrame = {
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait' | 'square';
};

const getProofFrame = (proofState: Pick<PlaqueState, 'width' | 'height'>): GeneratedProofFrame => ({
  width: proofState.width,
  height: proofState.height,
  orientation: proofState.width > proofState.height ? 'landscape' : proofState.width < proofState.height ? 'portrait' : 'square',
});

const sanitizeProofStateForRemoteSave = (proofState: PlaqueState): PlaqueState => ({
  ...proofState,
  conceptImageUrl: null,
  memorialImageSourceUrl: null,
  memorialImagePreviewUrl: null,
  etchmasterStyleReferenceUrl: null,
});

const App: React.FC = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [currentView, setCurrentView] = useState<SiteView>(getInitialView);
  const [selectedProductSlug, setSelectedProductSlug] = useState(getInitialProductSlug);
  const [selectedLandingSlug, setSelectedLandingSlug] = useState(getInitialLandingSlug);
  const [mockOrders, setMockOrders] = useState<MockOrder[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [hasSelectedSize, setHasSelectedSize] = useState(false);
  const [designerGuideOpen, setDesignerGuideOpen] = useState(false);
  const [designerGuideTab, setDesignerGuideTab] = useState<'how' | 'gallery' | 'guide'>('how');
  const [expandedGuideImage, setExpandedGuideImage] = useState<number | null>(null);
  const [showDesignerIntro, setShowDesignerIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('instaplaque-designer-intro-seen') !== '1';
    } catch {
      return true;
    }
  });

  const [state, setState] = useState<PlaqueState>(PROOF_BENCH_INITIAL_STATE);
  const [inscriptionPrompt, setInscriptionPrompt] = useState('');
  const [inscriptionGuidance, setInscriptionGuidance] = useState('');
  const [generatedLayoutSignature, setGeneratedLayoutSignature] = useState<string | null>(null);
  const [generatedProofFrame, setGeneratedProofFrame] = useState<GeneratedProofFrame | null>(null);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [realisticPreviewPrompt, setRealisticPreviewPrompt] = useState('');
  const [realisticPreviewAspectRatio, setRealisticPreviewAspectRatio] = useState('auto');
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [realisticReferenceImage, setRealisticReferenceImage] = useState<string | null>(null);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>(null);
  const [isProofExpanded, setIsProofExpanded] = useState(false);
  const [memorialSourceImage, setMemorialSourceImage] = useState<string | null>(null);
  const [showLayoutRegenToast, setShowLayoutRegenToast] = useState(false);
  const [isGeneratingMemorial, setIsGeneratingMemorial] = useState(false);
  const [memorialStatus, setMemorialStatus] = useState<string | null>(null);
  const [proofSaved, setProofSaved] = useState(false);
  const [basketAdded, setBasketAdded] = useState(false);
  const [isDesktopToolLayout, setIsDesktopToolLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );

  useEffect(() => {
    if (currentView !== 'plaque') return;
    document.title = 'Design a Custom Plaque Online | Free InstaPlaque Proof';
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', 'Use the InstaPlaque online plaque designer to create a free proof for a custom brass, stainless steel, bench or memorial plaque before checkout.');
    document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.setAttribute('content', 'index,follow');
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', 'https://instaplaque.co.uk/design');
    if (!document.getElementById('instaplaque-designer-fonts')) {
      const link = document.createElement('link');
      link.id = 'instaplaque-designer-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alex+Brush&family=Allura&family=Bebas+Neue&family=Bitter:wght@400;700&family=Caveat:wght@400;700&family=Cinzel:wght@400;700;900&family=Dancing+Script:wght@400;700&family=EB+Garamond:wght@400;600;700&family=Great+Vibes&family=Lato:wght@300;400;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:wght@300;400;700&family=Open+Sans:wght@300;400;600;700&family=Oswald:wght@400;600;700&family=Pacifico&family=Pinyon+Script&family=Raleway:wght@300;400;500;700&family=Roboto+Slab:wght@300;500;700&family=Satisfy&display=swap';
      document.head.appendChild(link);
    }
  }, [currentView]);

  const svgRef = useRef<SVGSVGElement>(null);
  const selectedProduct = getProductBySlug(selectedProductSlug);
  const selectedLanding = getLandingPageBySlug(selectedLandingSlug);

  // --- Auth & Startup Logic ---
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if running in AI Studio environment
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasAccess(hasKey);
        } else {
          // Running locally - Gemini calls are handled by the same-origin server proxy.
          console.log("Running locally with Gemini server proxy");
          setHasAccess(true);
        }
      } catch (e) {
        console.error("Failed to check API key status", e);
        // Fallback: allow access for local development
        setHasAccess(true);
      } finally {
        setIsCheckingAccess(false);
      }
    };
    checkAccess();
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const updateLayout = () => setIsDesktopToolLayout(query.matches);
    updateLayout();
    query.addEventListener('change', updateLayout);
    return () => query.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('plaques-ai-mock-orders');
      if (savedOrders) {
        setMockOrders(JSON.parse(savedOrders));
      }
    } catch {
      setMockOrders([]);
    }
  }, []);

  useEffect(() => {
    if (currentView !== 'admin') return;
    let cancelled = false;
    const loadHubOrders = async () => {
      try {
        const response = await fetch('/api/mock-admin-hub/orders');
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled || !Array.isArray(payload.orders)) return;
        setMockOrders(prev => {
          const knownIds = new Set(prev.map(order => order.id));
          return [...prev, ...payload.orders.filter((order: MockOrder) => !knownIds.has(order.id))];
        });
      } catch {
        // Local storage remains enough for the storefront prototype if the hub mock is unavailable.
      }
    };
    loadHubOrders();
    return () => {
      cancelled = true;
    };
  }, [currentView]);

  useEffect(() => {
    const handlePopState = () => {
      const productSlug = getProductSlugFromPath(window.location.pathname);
      if (productSlug) {
        setSelectedProductSlug(productSlug);
        setCurrentView('product');
        return;
      }
      const landingSlug = getLandingSlugFromPath(window.location.pathname);
      if (landingSlug) {
        setSelectedLandingSlug(landingSlug);
        setCurrentView('landing');
        return;
      }
      setCurrentView(routeViews[window.location.pathname] ?? 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleConnectApiKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasAccess(true);
    } catch (e) {
      console.error("API Key selection failed", e);
      alert("Failed to connect API Key. Please try again.");
    }
  };

  const handleApiError = (error: any) => {
    const msg = error?.toString()?.toLowerCase() || "";
    if (msg.includes("permission_denied") || msg.includes("403") || msg.includes("requested entity was not found")) {
      setHasAccess(false); // Reset access to force re-selection
      alert("Session expired or invalid permissions. Please reconnect your API key (Must be a paid project for Image Generation).");
    } else {
      alert("AI Generation failed: " + (error.message || "Unknown error"));
    }
  };

  // --- Core App Logic ---

  const price = React.useMemo(() => {
    return estimatePlaquePrice(state);
  }, [state]);

  const getLayoutSignature = (prompt: string) => makeLayoutSignature(prompt, state, inscriptionGuidance);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('proof');
    if (!token) return;

    let cancelled = false;
    const loadProofSession = async () => {
      try {
        const response = await fetch(`/api/proof-sessions/${encodeURIComponent(token)}`);
        if (!response.ok) throw new Error(`Could not load proof session (${response.status})`);
        const payload = await response.json();
        const proofSession = payload.proofSession;
        if (!proofSession || cancelled) return;

        const restoredState: PlaqueState = {
          ...PROOF_BENCH_INITIAL_STATE,
          ...(proofSession.plaque_state || {}),
          generatedSvgContent: proofSession.generated_svg || proofSession.plaque_state?.generatedSvgContent || null,
          aiReasoning: proofSession.ai_reasoning || proofSession.plaque_state?.aiReasoning || null,
        };
        const restoredWording = proofSession.wording || '';
        const restoredGuidance = proofSession.metadata?.inscriptionGuidance || '';

        setState(restoredState);
        setInscriptionPrompt(restoredWording);
        setInscriptionGuidance(restoredGuidance);
        setGeneratedLayoutSignature(
          restoredState.generatedSvgContent
            ? makeLayoutSignature(restoredWording, restoredState, restoredGuidance)
            : null
        );
        setGeneratedProofFrame(restoredState.generatedSvgContent ? getProofFrame(restoredState) : null);
        setHasSelectedSize(true);
        setActiveStep(restoredState.generatedSvgContent ? 5 : 0);
        setCurrentView('plaque');
        setProofSaved(true);
        setBasketAdded(false);
      } catch (error) {
        console.warn('Could not restore proof session.', error);
        alert('That proof link could not be loaded. The designer is still available to start a new proof.');
      }
    };

    loadProofSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (window.location.pathname !== '/checkout') return;
    const orderId = new URLSearchParams(window.location.search).get('order');
    if (!orderId) return;

    let cancelled = false;
    const restoreCheckoutOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not load order (${response.status})`);
        const order = payload.order;
        if (!order || cancelled) return;

        const restoredState: PlaqueState = {
          ...PROOF_BENCH_INITIAL_STATE,
          ...(order.plaqueState || order.state || {}),
        };
        const restoredWording = order.inscription || '';
        setState(restoredState);
        setInscriptionPrompt(restoredWording);
        setInscriptionGuidance('');
        setGeneratedLayoutSignature(
          restoredState.generatedSvgContent
            ? makeLayoutSignature(restoredWording, restoredState)
            : null
        );
        setGeneratedProofFrame(restoredState.generatedSvgContent ? getProofFrame(restoredState) : null);
        setHasSelectedSize(true);
        setActiveStep(restoredState.generatedSvgContent ? steps.length - 1 : 0);
        setProofSaved(true);
        setBasketAdded(true);
        setMockOrders(prev => {
          if (prev.some(savedOrder => savedOrder.id === order.id)) return prev;
          return [order, ...prev];
        });
      } catch (error) {
        console.warn('Could not restore cancelled checkout order.', error);
      }
    };

    restoreCheckoutOrder();
    return () => {
      cancelled = true;
    };
  }, []);

  const getInscriptionContext = (prompt: string) => {
    const normalizedPrompt = prompt.toLowerCase();
    const purpose = state.memorialImageEnabled
      || state.designStyle === DesignStyle.MemorialSolemn
      || /\b(in (?:loving )?memory|remembered|beloved|forever in our hearts|rest in peace)\b/.test(normalizedPrompt)
        ? 'memorial' as const
        : state.designStyle === DesignStyle.HeritagePlaque
          || /\b(heritage|listed|built|established|founded|anno domini)\b/.test(normalizedPrompt)
            ? 'heritage' as const
            : state.designStyle === DesignStyle.Institutional
              || /\b(dedicated|commemorating|opened by|officially opened)\b/.test(normalizedPrompt)
                ? 'commemorative' as const
                : 'commercial' as const;

    return {
      purpose,
      portraitRelationship: state.memorialImageEnabled
        ? `Image artwork uses the ${state.memorialImagePlacement} production layout. The available inscription box already excludes the artwork area. Compose the text as the image's deliberate visual partner without crowding it.`
        : 'No image artwork is present. The inscription is the primary composition.',
      layoutGuidance: inscriptionGuidance.trim() || undefined,
    };
  };

  const handleStateChange = (changes: Partial<PlaqueState>) => {
    setProofSaved(false);
    setBasketAdded(false);
    setState(prev => {
      const next = { ...prev, ...changes };
      if (changes.wood === true) {
        next.woodEdge = 'bevel';
      }
      if (next.shape === Shape.Rect) {
        next.cornerRadius = 0;
      }
      const nextIsBenchPlaque = isBenchPlaqueFormat(next.width, next.height, next.shape);
      const previousWasBenchPlaque = isBenchPlaqueFormat(prev.width, prev.height, prev.shape);
      if (nextIsBenchPlaque) {
        next.wood = false;
        next.safeMargin = Math.max(next.safeMargin, BENCH_SAFE_MARGIN_PERCENT);
        if (next.fixing === Fixing.Caps || next.fixing !== Fixing.Screws || !previousWasBenchPlaque || changes.fixing === Fixing.Screws) {
          next.fixingHoleCount = 2;
        }
      }
      if (next.shape === Shape.Heart) {
        next.wood = false;
        next.fixing = Fixing.VHB;
        next.fixingHoleCount = 2;
        if (changes.shape === Shape.Heart) {
          next.width = 180;
          next.height = 160;
          next.memorialImageEnabled = false;
        }
      }
      if (changes.etchmasterShapeMask) {
        if (changes.etchmasterShapeMask === EtchmasterShapeMask.Circle) {
          next.memorialImageShape = MemorialImageShape.Circle;
        } else if (changes.etchmasterShapeMask === EtchmasterShapeMask.Heart) {
          next.memorialImageShape = MemorialImageShape.Heart;
        }
      }
      return next;
    });
  };

  const handleClearDesign = () => {
    setGeneratedLayoutSignature(null);
    setGeneratedProofFrame(null);
    setState(prev => ({
      ...prev,
      generatedSvgContent: null,
      aiReasoning: null,
      conceptImageUrl: null
    }));
  };

  const handleMemorialImageUpload = async (file: File) => {
    if (!SUPPORTED_MEMORIAL_IMAGE_TYPES.includes(file.type)) {
      alert('Please upload a PNG, JPEG, WebP, or AVIF image.');
      return;
    }
    setProofSaved(false);
    setBasketAdded(false);

    try {
      const dataUrl = await prepareMemorialImageUpload(file);
      setMemorialSourceImage(dataUrl);
      setState(prev => ({
        ...prev,
        memorialImageEnabled: true,
        memorialImageSourceUrl: dataUrl,
        memorialImagePreviewUrl: dataUrl,
        memorialImageSvg: null,
        memorialImageScale: prev.memorialImageScale === 1 ? 1.75 : prev.memorialImageScale,
        memorialImageZoom: 1,
        memorialImageOffsetX: 0,
        memorialImageOffsetY: 0,
      }));
      setMemorialStatus(
        state.memorialImageMethod === MemorialImageMethod.UvPrinted
          ? 'Photo ready for full-colour UV print. Choose a layout and the proof will fit the whole image by default.'
          : 'Photo ready. Choose a production layout, then generate the engraving.'
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not prepare that image. Try converting it to PNG first.');
    }
  };

  const handleStyleReferenceUpload = async (file: File) => {
    if (!SUPPORTED_MEMORIAL_IMAGE_TYPES.includes(file.type)) {
      alert('Please upload a PNG, JPEG, WebP, or AVIF style image.');
      return;
    }
    try {
      const dataUrl = await prepareMemorialImageUpload(file);
      handleStateChange({ etchmasterStyleReferenceUrl: dataUrl });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not prepare that style image.');
    }
  };

  const handleGenerateMemorialImage = async () => {
    const sourceArtwork = memorialSourceImage || state.memorialImageSourceUrl || state.memorialImagePreviewUrl;
    if (state.memorialImageMethod === MemorialImageMethod.UvPrinted && !sourceArtwork) {
      alert('Upload colour artwork first.');
      return;
    }
    if (state.memorialImageMethod === MemorialImageMethod.Engraved && state.etchmasterMode !== EtchmasterImageMode.Prompt && !memorialSourceImage) {
      alert('Upload artwork first.');
      return;
    }
    if (state.memorialImageMethod === MemorialImageMethod.Engraved && state.etchmasterMode === EtchmasterImageMode.SubjectStyle && !state.etchmasterStyleReferenceUrl) {
      alert('Upload a style reference image first.');
      return;
    }

    setIsGeneratingMemorial(true);
    setMemorialStatus(
      state.memorialImageMethod === MemorialImageMethod.UvPrinted
        ? 'Preparing colour artwork for vector tracing...'
        : state.etchmasterEnhancePrompt ? 'Enhancing EtchMaster prompt...' : 'Preparing detailed etchable artwork...'
    );

    try {
      const { enhanceEtchingPrompt, generateMemorialEngraving, vectorizeColourImage, vectorizeMemorialImage } = await import('./services/memorialImageService');
      if (state.memorialImageMethod === MemorialImageMethod.UvPrinted) {
        setMemorialStatus('Tracing colour artwork into layered vector paths...');
        const svg = await vectorizeColourImage(
          sourceArtwork!,
          {
            paletteSize: Math.round(Math.max(6, Math.min(24, state.etchmasterVectorThreshold / 8))),
            detail: 72,
          },
          setMemorialStatus,
        );
        setState(prev => ({
          ...prev,
          memorialImagePreviewUrl: sourceArtwork,
          memorialImageSvg: svg,
        }));
        setMemorialStatus('Colour vector artwork placed on the plaque.');
        return;
      }

      const extraPrompt = state.etchmasterEnhancePrompt && state.etchmasterPrompt.trim()
        ? await enhanceEtchingPrompt(state.etchmasterPrompt)
        : state.etchmasterPrompt;
      const imageDataUrl = await generateMemorialEngraving({
        sourceImageDataUrl: memorialSourceImage,
        styleReferenceDataUrl: state.etchmasterStyleReferenceUrl,
        plaqueWidth: state.width,
        plaqueHeight: state.height,
        plaqueShape: state.shape,
        layout: state.memorialImagePlacement,
        shape: state.memorialImageShape,
        artworkScale: state.memorialImageScale,
        safeMargin: state.safeMargin,
        mode: state.etchmasterMode,
        model: state.etchmasterModel,
        imageSize: state.etchmasterImageSize,
        aspectRatio: state.etchmasterAspectRatio,
        preset: state.etchmasterPreset,
        removeBackground: state.etchmasterRemoveBackground,
        shapeMask: state.etchmasterShapeMask,
        shapeEdge: state.etchmasterShapeEdge,
        extraPrompt,
      });

      setMemorialStatus('Tracing engraving into vector artwork...');
      const svg = await vectorizeMemorialImage(imageDataUrl, state.etchmasterVectorThreshold, setMemorialStatus);

      setState(prev => ({
        ...prev,
        memorialImagePreviewUrl: imageDataUrl,
        memorialImageSvg: svg,
      }));
      setMemorialStatus('Artwork placed on the plaque.');
    } catch (error) {
      handleApiError(error);
      setMemorialStatus('Artwork generation failed.');
    } finally {
      setIsGeneratingMemorial(false);
    }
  };

  const handleClearMemorialImage = () => {
    setProofSaved(false);
    setBasketAdded(false);
    setMemorialSourceImage(null);
    setMemorialStatus(null);
    setState(prev => ({
      ...prev,
      memorialImageSourceUrl: null,
      memorialImageSvg: null,
      memorialImagePreviewUrl: null,
      etchmasterStyleReferenceUrl: null,
      memorialImageEnabled: false,
    }));
  };

  const handleGenerateLayout = async (prompt: string) => {
    setIsGeneratingLayout(true);
    setGenerationPhase(null);
    try {
      let effectivePrompt = prompt;
      setGenerationPhase('concept');
      effectivePrompt = await refinePlaqueWording(prompt);
      if (effectivePrompt !== prompt) {
        setInscriptionPrompt(effectivePrompt);
      }

      const inscriptionBox = getInscriptionLayout(state, effectivePrompt);
      const result = await generatePlaqueDesign(
        effectivePrompt,
        state.width,
        state.height,
        state.shape,
        state.designStyle,
        null,
        (phase) => setGenerationPhase(phase),
        { width: inscriptionBox.textW, height: inscriptionBox.textH },
        getInscriptionContext(effectivePrompt),
        TypographyEngine.GeminiAuthored
      );

      if (result) {
        setGeneratedLayoutSignature(getLayoutSignature(effectivePrompt));
        setGeneratedProofFrame(getProofFrame(state));
        setState(prev => ({
          ...prev,
          generatedSvgContent: result.svgContent,
          conceptImageUrl: result.conceptImageUrl,
          aiReasoning: effectivePrompt !== prompt
            ? `The typesetter corrected the inscription wording before layout. ${result.reasoning}`
            : result.reasoning
        }));
        setActiveStep(5);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsGeneratingLayout(false);
      setGenerationPhase(null);
    }
  };

  const handlePromptChange = (prompt: string) => {
    setInscriptionPrompt(prompt);
    setProofSaved(false);
    setBasketAdded(false);
  };

  const handleInscriptionGuidanceChange = (guidance: string) => {
    setInscriptionGuidance(guidance);
    setProofSaved(false);
    setBasketAdded(false);
  };

  const handleGeneratedSvgContentChange = (svgContent: string) => {
    setProofSaved(false);
    setBasketAdded(false);
    setState(prev => ({
      ...prev,
      generatedSvgContent: svgContent,
      aiReasoning: 'Manual typography edits applied to the generated layout.',
    }));
  };

  const handleRealPreview = async () => {
    if (!svgRef.current) return;
    if (!state.generatedSvgContent) {
      alert('Generate the inscription layout first, then create the realistic preview.');
      goToProof();
      return;
    }
    setModalOpen(true);
    setGeneratedImage(null);
    setRealisticReferenceImage(null);
    setIsGeneratingImage(true);

    try {
      const base64Png = await svgToPngBase64(svgRef.current, state);
      setRealisticReferenceImage(base64Png);
      const result = await generateRealisticView(base64Png, state, {
        prompt: realisticPreviewPrompt,
        aspectRatio: realisticPreviewAspectRatio,
      });
      setGeneratedImage(result);
    } catch (error) {
      handleApiError(error);
      setModalOpen(false);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleProofExpandButton = () => {
    setIsProofExpanded(prev => !prev);
  };

  const readinessWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    if (!state.generatedSvgContent) {
      warnings.push('Generate your inscription layout. The preview is still showing guide text.');
    }
    if (state.memorialImageEnabled && state.memorialImageMethod === MemorialImageMethod.Engraved && !state.memorialImageSvg) {
      warnings.push('Generate the engraved artwork.');
    }
    if (state.memorialImageEnabled && state.memorialImageMethod === MemorialImageMethod.UvPrinted && !state.memorialImageSourceUrl && !state.memorialImagePreviewUrl) {
      warnings.push('Upload the full-colour artwork.');
    }
    return warnings;
  }, [generatedLayoutSignature, inscriptionGuidance, inscriptionPrompt, state.designStyle, state.generatedSvgContent, state.height, state.memorialImageEnabled, state.memorialImageMethod, state.memorialImagePlacement, state.memorialImagePreviewUrl, state.memorialImageScale, state.memorialImageShape, state.memorialImageSourceUrl, state.memorialImageSvg, state.shape, state.typographyEngine, state.width]);

  const layoutRegenNotice = React.useMemo(() => {
    if (!state.generatedSvgContent || !generatedProofFrame) return null;
    const currentFrame = getProofFrame(state);
    if (generatedProofFrame.orientation !== currentFrame.orientation) {
      return {
        tone: 'orientation' as const,
        message: `You switched from ${generatedProofFrame.orientation} to ${currentFrame.orientation}. The text may still work, but regenerate it if the layout looks off.`,
      };
    }
    if (generatedProofFrame.width !== currentFrame.width || generatedProofFrame.height !== currentFrame.height) {
      return {
        tone: 'size' as const,
        message: 'Size changed since the text was generated. If the proof still looks good, you can continue; regenerate text if it needs rebalancing.',
      };
    }
    return null;
  }, [generatedProofFrame, state.generatedSvgContent, state.height, state.width]);

  React.useEffect(() => {
    if (!layoutRegenNotice) {
      setShowLayoutRegenToast(false);
      return;
    }

    setShowLayoutRegenToast(true);
    const timer = window.setTimeout(() => setShowLayoutRegenToast(false), 8500);
    return () => window.clearTimeout(timer);
  }, [layoutRegenNotice?.message]);

  const isProductionReady = readinessWarnings.length === 0;
  const readinessItems = [
    {
      label: state.generatedSvgContent
        ? 'Inscription layout is generated'
        : 'Generate your inscription layout',
      ready: !!state.generatedSvgContent,
      step: 5,
    },
    {
      label: !state.memorialImageEnabled
        ? 'Text-only plaque selected'
        : state.memorialImageMethod === MemorialImageMethod.UvPrinted
          ? state.memorialImageSourceUrl || state.memorialImagePreviewUrl
            ? 'Full-colour artwork is ready'
            : 'Upload the full-colour artwork'
          : state.memorialImageSvg
            ? 'Engraved artwork is ready'
            : 'Generate the engraved artwork',
      ready: !state.memorialImageEnabled
        || (state.memorialImageMethod === MemorialImageMethod.UvPrinted
          ? !!(state.memorialImageSourceUrl || state.memorialImagePreviewUrl)
          : !!state.memorialImageSvg),
      step: 6,
    },
  ];

  const confirmReadiness = (action: string) => {
    if (isProductionReady) return true;
    return window.confirm(
      `Create a draft ${action}?\n\n${readinessWarnings.map(warning => `- ${warning}`).join('\n')}\n\nThis is fine for review, but finish the proof before using it for production.`
    );
  };

  const handleExportSvg = async () => {
    if (!svgRef.current) return;
    if (!confirmReadiness('Corel SVG export')) return;
    await downloadCorelSvg(svgRef.current, state);
  };

  const handleExportPdf = async () => {
    if (!svgRef.current) return;
    if (!confirmReadiness('PDF export')) return;
    let continueUrl: string | undefined;
    try {
      const response = await fetch('/api/proof-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: isProductionReady ? 'proof_ready' : 'draft',
          plaqueState: sanitizeProofStateForRemoteSave(state),
          wording: inscriptionPrompt,
          generatedSvg: state.generatedSvgContent,
          aiReasoning: state.aiReasoning,
          priceEstimatePence: Math.round(price * 100),
          currency: 'gbp',
          metadata: {
            inscriptionGuidance,
            source: 'pdf-resume-link-trial',
          },
        }),
      });
      if (!response.ok) throw new Error(`Proof session save failed (${response.status})`);
      const payload = await response.json();
      const token = payload.proofSession?.public_token;
      if (token) {
        continueUrl = `${window.location.origin}/design?proof=${encodeURIComponent(token)}`;
      }
    } catch (error) {
      console.warn('PDF resume link was not added.', error);
    }
    const proofImageBase64 = generatedImage || await svgToProofPngBase64(svgRef.current);
    await downloadPdf(svgRef.current, state, {
      continueUrl,
      proofImageBase64,
      wording: inscriptionPrompt,
      price,
    });
  };

  const handleNativePrint = () => {
    if (!confirmReadiness('Print')) return;
    window.print();
  };

  const handleSaveProof = () => {
    const savedProof = {
      savedAt: new Date().toISOString(),
      inscriptionPrompt,
      state: {
        ...state,
        conceptImageUrl: null,
        memorialImageSourceUrl: null,
        memorialImagePreviewUrl: null,
      },
      hasPortraitSource: !!(state.memorialImageSourceUrl || state.memorialImagePreviewUrl),
    };
    try {
      localStorage.setItem('plaques-ai-saved-proof', JSON.stringify(savedProof));
      setProofSaved(true);
    } catch {
      alert('This browser could not save the proof locally. Your current design is still open.');
    }
  };

  const handleAddToBasket = async () => {
    if (!isProductionReady) {
      goToProof();
      return;
    }
    setBasketAdded(true);
    const order = await handleCreateMockOrder('Stripe checkout customer', '');
    const checkoutUrl = order.stripeSimulation.checkoutUrl;
    if (!checkoutUrl) {
      throw new Error('Stripe checkout did not return a checkout URL.');
    }
    window.location.assign(checkoutUrl);
  };

  const handleNavigate = (view: SiteView, productSlug?: string) => {
    const nextView = view === 'home' ? 'plaque' : view;
    if (view === 'product' && productSlug) {
      setSelectedProductSlug(productSlug);
    }
    if (view === 'landing' && productSlug) {
      setSelectedLandingSlug(productSlug);
    }
    setCurrentView(nextView);
    const route = (nextView === 'product' || nextView === 'landing') && productSlug ? `/${productSlug}` : viewRoutes[nextView];
    if (route && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
  };

  const handleStartDesign = (startingWording = '') => {
    setState(PROOF_BENCH_INITIAL_STATE);
    setInscriptionPrompt(startingWording);
    setInscriptionGuidance('');
    setGeneratedLayoutSignature(null);
    setGeneratedProofFrame(null);
    setGeneratedImage(null);
    setRealisticReferenceImage(null);
    setMemorialSourceImage(null);
    setMemorialStatus(null);
    setProofSaved(false);
    setBasketAdded(false);
    setHasSelectedSize(false);
    setActiveStep(0);
    setCurrentView('plaque');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleLaunchProduct = (product: ProductFamily) => {
    setSelectedProductSlug(product.slug);
    setHasSelectedSize(true);
    setState(prev => {
      const next = {
        ...prev,
        ...product.preset,
        generatedSvgContent: null,
        aiReasoning: null,
        conceptImageUrl: null,
      };
      if (isBenchPlaqueFormat(next.width, next.height, next.shape)) {
        next.wood = false;
        next.fixingHoleCount = 2;
        next.safeMargin = Math.max(next.safeMargin, BENCH_SAFE_MARGIN_PERCENT);
      }
      return next;
    });
    setInscriptionPrompt(product.proofPrompt);
    setGeneratedLayoutSignature(null);
    setGeneratedProofFrame(null);
    setProofSaved(false);
    setBasketAdded(false);
    setCurrentView('plaque');
    setActiveStep(0);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const persistCheckoutOrder = (order: MockOrder) => {
    setMockOrders(prev => {
      const next = [order, ...prev.filter(savedOrder => savedOrder.id !== order.id)];
      try {
        localStorage.setItem('plaques-ai-mock-orders', JSON.stringify(next));
      } catch {
        // Non-critical: the in-memory order still exists for this prototype session.
      }
      return next;
    });
    fireAndForget(fetch('/api/mock-admin-hub/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      }), (error) => {
      console.warn('Mock admin hub handoff was not persisted on the server.', error);
    });
  };

  const handleCreateMockOrder = async (customerName: string, customerEmail: string, deliveryAddress?: DeliveryAddress, proofSvg?: SVGSVGElement | null) => {
    const proofSourceSvg = proofSvg || svgRef.current;
    const visualProofSvg = proofSourceSvg?.outerHTML || state.generatedSvgContent || null;
    if (!proofSourceSvg) {
      throw new Error('The approved proof is not ready. Please return to the proof step and try again.');
    }
    const plaqueSummaryTitle = getPlaqueSummaryTitle(state, selectedProduct.title);
    const order = makeMockOrder(state, inscriptionPrompt, plaqueSummaryTitle, customerName, customerEmail, {
      productionSvg: state.generatedSvgContent,
      visualProofSvg,
      visualProofPng: null,
    }, deliveryAddress);
    let checkoutOrder = order;
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          orderId: order.id,
          customerEmail,
          productTitle: plaqueSummaryTitle,
          totalPence: Math.round(order.total * 100),
          origin: window.location.origin,
          uiMode: 'hosted',
          deliveryAddress,
          orderSnapshot: order,
        }),
      });
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error(`Stripe checkout failed (${response.status})`);
      const payload = await response.json();
      const session = payload.session;
      if (session?.id && (session?.url || session?.clientSecret)) {
        checkoutOrder = {
          ...order,
          status: order.status === 'needs-check' ? order.status : 'checkout-started',
          stripeSimulation: {
            provider: 'stripe',
            mode: session.livemode ? 'live' : 'test',
            checkoutSessionId: session.id,
            paymentIntentId: session.paymentIntentId || '',
            receiptUrl: session.url,
            checkoutUrl: session.url,
            embeddedClientSecret: session.clientSecret || '',
            publishableKey: session.publishableKey || '',
            uiMode: session.uiMode || 'hosted',
          },
        };
        if (checkoutOrder.stripeSimulation.checkoutUrl && checkoutOrder.stripeSimulation.uiMode !== 'embedded') {
          persistCheckoutOrder(checkoutOrder);
          return checkoutOrder;
        }
      } else {
        throw new Error('Stripe checkout did not return a checkout URL.');
      }
    } catch (error) {
      console.error('Stripe checkout session could not be created.', error);
      throw error;
    }
    persistCheckoutOrder(checkoutOrder);
    return checkoutOrder;
  };

  // --- Render ---
  const steps = ['Size/Shape', 'Material', 'Colour', 'Fixings and border', 'Wood', 'Text', 'Proof'];
  const stepShortLabels = ['Size', 'Material', 'Colour', 'Fixings', 'Wood', 'Text', 'Proof'];
  const progress = ((activeStep + 1) / steps.length) * 100;
  const canGoBack = activeStep > 0;
  const canGoNext = activeStep < steps.length - 1;
  const showMaterialPrices = hasSelectedSize && selectedProduct.slug !== 'custom-plaques';

  const goBack = () => setActiveStep(step => Math.max(0, step - 1));
  const goNext = () => setActiveStep(step => Math.min(steps.length - 1, step + 1));
  const goToProof = () => {
    setCurrentView('plaque');
    setActiveStep(steps.length - 1);
  };

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1e7]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b98235] border-t-transparent"></div>
          <p className="text-sm font-bold text-[#6a746d]">Initializing InstaPlaque...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f7f1e7] p-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b98235]/10 blur-[120px]" />

        <div className="glass-panel relative z-10 w-full max-w-md rounded-lg p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-[#f2d688] to-[#8d542a] text-3xl font-black text-[#1b231f] shadow-lg shadow-[#b98235]/20">
            IP
          </div>

          <h1 className="brand-wordmark brand-wordmark--access mb-2 justify-center"><span>Insta</span><span>Plaque</span></h1>
          <p className="mb-8 text-sm leading-relaxed text-[#6a746d]">
            Welcome to the Pro Designer. To access high-fidelity realistic previews and AI layout generation, please connect your Google Cloud Project.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleConnectApiKey}
              className="studio-press flex w-full items-center justify-center gap-2 rounded-lg bg-[#f2d688] py-3.5 font-black text-[#1b231f] shadow-xl"
            >
              <svg className="h-5 w-5 text-[#7c441e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Connect API Key
            </button>

            <p className="text-[10px] text-[#8a8275]">
              Requires a paid project for Veo/Image generation models. <br />
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[#9a6a16] hover:underline">
                View billing documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stepIcons = ['◉', '▦', '●', '⌁', '▥', 'T', '✓'];
  const formattedPrice = (() => {
    const hasPence = Math.round(price * 100) % 100 !== 0;
    return price.toLocaleString('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: hasPence ? 2 : 0,
      maximumFractionDigits: hasPence ? 2 : 0,
    });
  })();
  const showProofPrice = currentView === 'plaque' && hasSelectedSize;
  const showHeaderPrice = currentView === 'plaque' && hasSelectedSize;
  const proofSpecTrail = getPlaqueSummaryTitle(state);
  const dismissDesignerIntro = () => {
    setShowDesignerIntro(false);
    try {
      localStorage.setItem('instaplaque-designer-intro-seen', '1');
    } catch {
      // The guide can still be dismissed when storage is unavailable.
    }
  };

  return (
    <div className={`studio-app-shell proofbench-app flex flex-col bg-transparent text-[#eef4ee] ${currentView !== 'plaque' ? 'commerce-mode' : ''}`}>
      <Header
        onNavigate={handleNavigate}
        onStartDesign={handleStartDesign}
        currentView={currentView}
        priceLabel={formattedPrice}
        showPrice={showHeaderPrice}
      />

      {layoutRegenNotice && showLayoutRegenToast && (
        <div className={`layout-regen-toast layout-regen-toast--${layoutRegenNotice.tone}`} role="status" aria-live="polite">
          <button
            type="button"
            className="layout-regen-toast__close"
            aria-label="Dismiss"
            onClick={() => setShowLayoutRegenToast(false)}
          >
            ×
          </button>
          <span>{layoutRegenNotice.message}</span>
          <button
            type="button"
            className="layout-regen-toast__action"
            onClick={() => {
              setCurrentView('plaque');
              setActiveStep(5);
              setShowLayoutRegenToast(false);
            }}
          >
            Regenerate text
          </button>
        </div>
      )}

      <main className={`min-h-0 w-full flex-1 ${currentView === 'plaque' ? 'overflow-hidden' : 'overflow-auto'}`}>

        {currentView !== 'plaque' ? (
          <SiteExperience
            view={currentView}
            selectedProduct={selectedProduct}
            selectedLanding={selectedLanding}
            state={state}
            inscription={inscriptionPrompt}
            price={price}
            isProductionReady={isProductionReady}
            orders={mockOrders}
            onNavigate={handleNavigate}
            onStartDesign={handleStartDesign}
            onLaunchProduct={handleLaunchProduct}
            onCreateMockOrder={handleCreateMockOrder}
          />
        ) : (
          <>
          <div className="app-fade-in proofbench-board grid h-full min-h-0 w-full grid-rows-[minmax(0,46%)_minmax(0,54%)] gap-0 p-0 md:grid-cols-[82px_358px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:gap-0 md:px-8 md:pb-7 md:pt-4 xl:grid-cols-[88px_390px_minmax(0,1fr)]">
            <nav className="proofbench-rail no-print hidden min-h-0 flex-col items-center justify-center py-4 md:flex">
              <div className="flex w-full flex-col items-center gap-3">
                {steps.map((label, index) => (
                  <button
                    key={label}
                    onClick={() => setActiveStep(index)}
                    aria-label={`Go to ${label}`}
                    aria-current={index === activeStep ? 'step' : undefined}
                    className={`proofbench-step-button ${index === activeStep ? 'is-active' : ''} ${index < activeStep ? 'is-complete' : ''}`}
                    data-icon={stepIcons[index]}
                    data-short={stepShortLabels[index]}
                  >
                    {index + 1} {label}
                  </button>
                ))}
              </div>
            </nav>

            <aside className="proofbench-customiser no-print row-start-2 min-h-0 min-w-0 overflow-hidden md:col-start-2 md:row-start-1">
              <div className="proofbench-customiser-head hidden md:flex">
                <div>
                  <p className="proofbench-designer-kicker">Design your custom plaque</p>
                  {isDesktopToolLayout ? (
                    <h1 className="proofbench-designer-title">Design your custom plaque</h1>
                  ) : (
                    <p className="proofbench-designer-title">Design your custom plaque</p>
                  )}
                  <h2 className="proofbench-designer-step">{steps[activeStep]}</h2>
                  <p className="proofbench-designer-summary">
                    Step {activeStep + 1} of {steps.length} · {proofSpecTrail} · proof before payment
                  </p>
                </div>
              </div>
              <div className="proofbench-mobile-tabs md:hidden">
                {steps.map((label, index) => (
                  <button
                    key={label}
                    onClick={() => setActiveStep(index)}
                    className={index === activeStep ? 'is-active' : ''}
                    aria-label={`Go to ${label}`}
                  >
                    <span>{stepIcons[index]}</span>
                    <small>{stepShortLabels[index]}</small>
                  </button>
                ))}
              </div>
              <div className="proofbench-sheet-handle md:hidden" />
              <div className="proofbench-control-scroll">
                <Controls
                  state={state}
                  onChange={handleStateChange}
                  onGenerate={handleGenerateLayout}
                  onClear={handleClearDesign}
                  prompt={inscriptionPrompt}
                  onPromptChange={handlePromptChange}
                  guidance={inscriptionGuidance}
                  onGuidanceChange={handleInscriptionGuidanceChange}
                  onGeneratedSvgContentChange={handleGeneratedSvgContentChange}
                  isGenerating={isGeneratingLayout}
                  generationPhase={generationPhase}
                  onMemorialImageUpload={handleMemorialImageUpload}
                  onStyleReferenceUpload={handleStyleReferenceUpload}
                  onGenerateMemorialImage={handleGenerateMemorialImage}
                  onClearMemorialImage={handleClearMemorialImage}
                  isGeneratingMemorialImage={isGeneratingMemorial}
                  memorialStatus={memorialStatus}
                  activeStep={activeStep}
                  hasSelectedSize={hasSelectedSize}
                  onSizeSelected={() => setHasSelectedSize(true)}
                  showMaterialPrices={showMaterialPrices}
                  price={price}
                  readinessItems={readinessItems}
                  isProductionReady={isProductionReady}
                  basketAdded={basketAdded}
                  onGoToStep={setActiveStep}
                  onSaveProof={handleSaveProof}
                  onAddToBasket={handleAddToBasket}
                  onCreateMockOrder={handleCreateMockOrder}
                  onRealisticPreview={handleRealPreview}
                  realisticPreviewPrompt={realisticPreviewPrompt}
                  onRealisticPreviewPromptChange={setRealisticPreviewPrompt}
                  realisticPreviewAspectRatio={realisticPreviewAspectRatio}
                  onRealisticPreviewAspectRatioChange={setRealisticPreviewAspectRatio}
                  onExportSvg={handleExportSvg}
                  onExportPdf={handleExportPdf}
                  onPrint={handleNativePrint}
                />
                <div className="proofbench-designer-footer proofbench-designer-footer--mobile no-print">
                  <div className="proofbench-designer-trust">
                    <span>Secure checkout powered by Stripe</span>
                    <i />
                    <span>Free UK mainland delivery</span>
                  </div>
                  <nav className="proofbench-designer-legal" aria-label="Legal and support">
                    <a href="/terms">Terms</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/cookies">Cookies</a>
                    <a href="/returns-cancellations">Returns</a>
                    <a href="/contact">Contact</a>
                  </nav>
                </div>
              </div>
              <div className="proofbench-designer-footer proofbench-designer-footer--desktop no-print">
                <div className="proofbench-designer-trust">
                  <span>Secure checkout powered by Stripe</span>
                  <i />
                  <span>Free UK mainland delivery</span>
                </div>
                <nav className="proofbench-designer-legal" aria-label="Legal and support">
                  <a href="/terms">Terms</a>
                  <a href="/privacy">Privacy</a>
                  <a href="/cookies">Cookies</a>
                  <a href="/returns-cancellations">Returns</a>
                  <a href="/contact">Contact</a>
                </nav>
              </div>
            </aside>

            <section className={`proofbench-stage relative row-start-1 min-h-0 min-w-0 overflow-hidden md:col-start-3 md:row-start-1 ${isProofExpanded ? 'is-expanded' : ''}`}>
              <div className="proofbench-mobile-top no-print md:hidden">
                <div className="proofbench-mobile-heading">
                  <button type="button" className="proofbench-mobile-brand" onClick={() => handleNavigate('home')}>
                    <span className="brand-wordmark brand-wordmark--mobile-tool">
                      <span>Insta</span><span>Plaque</span>
                    </span>
                  </button>
                  {isDesktopToolLayout ? (
                    <p className="proofbench-mobile-title proofbench-mobile-promise">
                      <span>Design your own plaque online</span>
                      <span>Free UK mainland delivery</span>
                      <span>Secure payment powered by Stripe</span>
                    </p>
                  ) : (
                    <h1 className="proofbench-mobile-title proofbench-mobile-promise">
                      <span>Design your own plaque online</span>
                      <span>Free UK mainland delivery</span>
                      <span>Secure payment powered by Stripe</span>
                    </h1>
                  )}
                  <small className="proofbench-mobile-spec" title={proofSpecTrail}>{proofSpecTrail}</small>
                </div>
                {showProofPrice && (
                  <button
                    type="button"
                    className="proofbench-mobile-price"
                    aria-label={
                      isProductionReady
                        ? `Checkout with current price ${formattedPrice} including UK delivery`
                        : `Review proof before checkout. Current price ${formattedPrice} including UK delivery`
                    }
                    onClick={() => {
                      void handleAddToBasket().catch((error) => {
                        alert(error instanceof Error ? error.message : 'Secure checkout could not be opened.');
                      });
                    }}
                  >
                    <strong>{formattedPrice}</strong>
                    <span>inc delivery</span>
                  </button>
                )}
              </div>

              <div className="proofbench-dimension-top hidden md:block">{state.width} mm</div>
              <div className="proofbench-dimension-left hidden md:block">{state.height} mm</div>
              <div className="proofbench-proof-pad">
                <div className="proofbench-svg-preview">
                  <PlaquePreview ref={svgRef} state={state} activeStep={activeStep} inscription={inscriptionPrompt} />
                </div>
                {isProofExpanded && (
                  <Suspense
                    fallback={(
                      <div className="three-plaque-preview" aria-label="Loading 3D plaque preview">
                        <div className="three-plaque-preview__label no-print">
                          <strong>3D</strong>
                          <span>loading</span>
                        </div>
                      </div>
                    )}
                  >
                    <ThreePlaquePreview
                      state={state}
                      activeStep={activeStep}
                      inscription={inscriptionPrompt}
                      sourceSvgRef={svgRef}
                    />
                  </Suspense>
                )}
              </div>
              <button
                type="button"
                onClick={handleProofExpandButton}
                className="proofbench-expand-button no-print"
                aria-label={isProofExpanded ? 'Close expanded 3D proof' : 'Expand proof into 3D preview'}
                aria-pressed={isProofExpanded}
              >
                {isProofExpanded ? (
                  <><span aria-hidden="true">←</span><strong>2D proof</strong></>
                ) : (
                  <><span aria-hidden="true">◇</span><strong>3D view</strong></>
                )}
              </button>
            </section>

          </div>

          {showDesignerIntro && (
            <aside className="designer-welcome no-print" aria-labelledby="designer-welcome-title">
              <button type="button" className="designer-welcome__close" onClick={dismissDesignerIntro} aria-label="Close introduction">×</button>
              <p>Welcome to InstaPlaque</p>
              <h2 id="designer-welcome-title">Design your plaque here.</h2>
              <span>Choose the material, size and wording. You will see the proof and price before you pay.</span>
              <div>
                <button
                  type="button"
                  className="designer-welcome__guide"
                  onClick={() => {
                    dismissDesignerIntro();
                    setDesignerGuideOpen(true);
                  }}
                >
                  Quick guide
                </button>
                <button type="button" className="designer-welcome__start" onClick={dismissDesignerIntro}>Start designing</button>
              </div>
              <small>Free to design · no account needed · free UK mainland delivery</small>
            </aside>
          )}

          <button
            type="button"
            className="designer-guide-trigger no-print"
            onClick={() => setDesignerGuideOpen(true)}
            aria-expanded={designerGuideOpen}
            aria-controls="designer-guide"
          >
            <span>?</span><strong>Plaque guide</strong>
          </button>

          <aside
            id="designer-guide"
            className={`designer-guide no-print ${designerGuideOpen ? 'is-open' : ''}`}
            aria-hidden={!designerGuideOpen}
          >
            <header>
              <div>
                <p>Help while you design</p>
                <h2>Plaque guide</h2>
              </div>
              <button type="button" onClick={() => { setExpandedGuideImage(null); setDesignerGuideOpen(false); }} aria-label="Close plaque guide">×</button>
            </header>
            <div className="designer-guide__tabs" role="tablist" aria-label="Plaque guide sections">
              {([
                ['how', 'How it works'],
                ['gallery', 'Gallery'],
                ['guide', 'Guide & FAQs'],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`designer-guide-tab-${tab}`}
                  aria-selected={designerGuideTab === tab}
                  aria-controls={`designer-guide-panel-${tab}`}
                  tabIndex={designerGuideTab === tab ? 0 : -1}
                  className={designerGuideTab === tab ? 'is-active' : ''}
                  onClick={() => { setExpandedGuideImage(null); setDesignerGuideTab(tab); }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="designer-guide__scroll">
              {designerGuideTab === 'how' && (
                <section className="designer-guide__panel designer-guide__panel--how" role="tabpanel" id="designer-guide-panel-how" aria-labelledby="designer-guide-tab-how">
                  <div className="designer-guide__intro">
                    <p>From idea to approved proof</p>
                    <h3>How the designer works</h3>
                    <span>Work through seven simple steps. Your live plaque, specification and price stay together, and you can return to any step before checkout.</span>
                  </div>
                  <div className="designer-guide__assurance">
                    <strong>Free to design</strong>
                    <span>No account is needed. Nothing is manufactured until you have checked the proof and placed the order.</span>
                  </div>
                  <ol className="designer-guide__steps">
                    {DESIGNER_GUIDE_STEPS.map((step, index) => (
                      <li key={step.title}>
                        <span className="designer-guide__step-number">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <h4>{step.title}</h4>
                          <p>{step.copy}</p>
                          <small><strong>Example:</strong> {step.example}</small>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStep(index);
                            setDesignerGuideOpen(false);
                          }}
                          aria-label={`Open designer step: ${step.title}`}
                        >
                          Open step <span aria-hidden="true">→</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <div className="designer-guide__examples">
                    <p>Useful starting points</p>
                    <div>
                      <article><strong>Bench memorial</strong><span>150 × 50 mm · brass or steel · four holes · name, dates and one short line</span></article>
                      <article><strong>Garden memorial</strong><span>A5 · aged brass or steel · suitable outdoor fixings · short dedication</span></article>
                      <article><strong>Opening plaque</strong><span>A4 · brass or steel · venue, opened by, role and date</span></article>
                    </div>
                  </div>
                </section>
              )}
              {designerGuideTab === 'gallery' && (
                <section className="designer-guide__panel designer-guide__panel--gallery" role="tabpanel" id="designer-guide-panel-gallery" aria-labelledby="designer-guide-tab-gallery">
                  <div className="designer-guide__intro">
                    <p>Real plaque inspiration</p>
                    <h3>See what is possible</h3>
                    <span>Explore finishes, settings and shapes while your own design stays exactly as you left it.</span>
                  </div>
                  <div className="designer-guide__gallery">
                    {DESIGNER_GUIDE_GALLERY.map((item, index) => (
                      <figure key={item.src}>
                        <button type="button" onClick={() => setExpandedGuideImage(index)} aria-label={`Expand ${item.title}`}>
                          <div className="designer-guide__image-wrap">
                            <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                            <span>{item.type}</span>
                            <b aria-hidden="true">↗</b>
                          </div>
                          <figcaption>{item.title}</figcaption>
                        </button>
                      </figure>
                    ))}
                  </div>
                  <nav className="designer-guide__category-links" aria-label="Shop plaque types">
                    <a href="/bench-plaques">Bench plaques</a>
                    <a href="/memorial-plaques">Memorial plaques</a>
                    <a href="/garden-plaques">Garden plaques</a>
                    <a href="/custom-plaques">Custom plaques</a>
                  </nav>
                </section>
              )}
              {designerGuideTab === 'guide' && (
                <section className="designer-guide__panel designer-guide__panel--guide" role="tabpanel" id="designer-guide-panel-guide" aria-labelledby="designer-guide-tab-guide">
                  <div className="designer-guide__intro">
                    <p>Choose with confidence</p>
                    <h3>A quick plaque buying guide</h3>
                    <span>The essentials on size, finish, proofing and delivery.</span>
                  </div>
                  <div className="designer-guide__material-compare">
                    <article>
                      <img src="/materials/thumbs/brushed-brass.webp" alt="Close-up of warm brushed brass plaque material" loading="lazy" />
                      <div><strong>Brass</strong><span>Warm, traditional and especially suited to memorials and heritage settings.</span></div>
                    </article>
                    <article>
                      <img src="/materials/thumbs/brushed-stainless.webp" alt="Close-up of silver brushed stainless steel plaque material" loading="lazy" />
                      <div><strong>Stainless steel</strong><span>Clean, contemporary and durable for indoor or outdoor use.</span></div>
                    </article>
                  </div>
                  <details open>
                    <summary>Sizes and starting prices</summary>
                    <dl>
                      <div><dt>Bench · 150 × 50 mm</dt><dd>from £58.50</dd></div>
                      <div><dt>A5 · 210 × 148 mm</dt><dd>from £95.50</dd></div>
                      <div><dt>A4 · 297 × 210 mm</dt><dd>from £145</dd></div>
                    </dl>
                  </details>
                  <details>
                    <summary>Which size should I choose?</summary>
                    <p>Bench plaques suit shorter wording. A5 is a useful starting size for gardens and walls; choose A4 when the wording needs more room or greater visibility.</p>
                  </details>
                  <details>
                    <summary>How the free proof works</summary>
                    <p>Build the plaque, add your wording and generate the layout. Check the spelling, spacing, material, fixings and exact price before checkout.</p>
                  </details>
                  <details>
                    <summary>Delivery and turnaround</summary>
                    <p>UK mainland delivery is free. Standard orders are usually estimated at five working days after payment and proof approval. Some custom options take longer.</p>
                  </details>
                  <div className="designer-guide__intro">
                    <p>Good to know</p>
                    <h3>Frequently asked questions</h3>
                    <span>Quick answers without leaving your design.</span>
                  </div>
                  <details open>
                    <summary>Is it free to design a plaque?</summary>
                    <p>Yes. You can create and revise your proof without an account and there is no charge until you approve it and choose to order.</p>
                  </details>
                  <details>
                    <summary>Can I change the design before paying?</summary>
                    <p>Yes. Move back through any designer step to change the size, material, wording, layout or fixings before checkout.</p>
                  </details>
                  <details>
                    <summary>Can the plaque be used outdoors?</summary>
                    <p>Yes. Brass and stainless steel plaques are suitable for outdoor use. The right fixing depends on whether it will be fitted to wood, masonry or another surface.</p>
                  </details>
                  <details>
                    <summary>Will somebody check unusual designs?</summary>
                    <p>Yes. Designs needing special production attention can receive a human artwork check before manufacture.</p>
                  </details>
                  <details>
                    <summary>Is delivery included?</summary>
                    <p>UK mainland delivery is included. Highlands, islands and non-UK destinations may need an additional delivery quote.</p>
                  </details>
                  <a className="designer-guide__all-faqs" href="/faq">Read all plaque FAQs →</a>
                </section>
              )}
            </div>
            {expandedGuideImage !== null && (
              <section className="designer-gallery-viewer" role="dialog" aria-modal="true" aria-labelledby="designer-gallery-viewer-title">
                <header className="designer-gallery-viewer__toolbar">
                  <button type="button" onClick={() => setExpandedGuideImage(null)} aria-label="Return to gallery">← <span>Gallery</span></button>
                  <div>
                    <strong id="designer-gallery-viewer-title">{DESIGNER_GUIDE_GALLERY[expandedGuideImage].title}</strong>
                    <span>{expandedGuideImage + 1} / {DESIGNER_GUIDE_GALLERY.length}</span>
                  </div>
                  <button type="button" onClick={() => setExpandedGuideImage(null)} aria-label="Close expanded image">×</button>
                </header>
                <div className="designer-gallery-viewer__stage">
                  <button
                    type="button"
                    className="designer-gallery-viewer__previous"
                    onClick={() => setExpandedGuideImage((expandedGuideImage - 1 + DESIGNER_GUIDE_GALLERY.length) % DESIGNER_GUIDE_GALLERY.length)}
                    aria-label="Previous gallery image"
                  >‹</button>
                  <img src={DESIGNER_GUIDE_GALLERY[expandedGuideImage].src} alt={DESIGNER_GUIDE_GALLERY[expandedGuideImage].alt} />
                  <button
                    type="button"
                    className="designer-gallery-viewer__next"
                    onClick={() => setExpandedGuideImage((expandedGuideImage + 1) % DESIGNER_GUIDE_GALLERY.length)}
                    aria-label="Next gallery image"
                  >›</button>
                </div>
                <footer>
                  <span>{DESIGNER_GUIDE_GALLERY[expandedGuideImage].type}</span>
                  <div><strong>{DESIGNER_GUIDE_GALLERY[expandedGuideImage].title}</strong><p>{DESIGNER_GUIDE_GALLERY[expandedGuideImage].note}</p></div>
                </footer>
              </section>
            )}
          </aside>
          {designerGuideOpen && <button type="button" className="designer-guide-backdrop no-print" aria-label="Close plaque guide" onClick={() => { setExpandedGuideImage(null); setDesignerGuideOpen(false); }} />}
          </>
        )}
      </main>

      <div className="no-print">
        <RealisticPreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isLoading={isGeneratingImage}
          imageUrl={generatedImage}
          referenceImageUrl={realisticReferenceImage}
        />
      </div>
    </div>
  );
};

export default App;
