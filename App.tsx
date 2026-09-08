import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import PlaquePreview from './components/PlaquePreview';
import { Controls } from './components/Controls';
import { RealisticPreviewModal } from './components/RealisticPreviewModal';
import { SiteExperience, useSeoMeta } from './components/SiteExperience';
import { BorderStyle, DesignStyle, EtchmasterImageMode, EtchmasterShapeMask, Fixing, INITIAL_STATE, Material, MemorialImageMethod, MemorialImagePlacement, MemorialImageShape, PlaqueState, Shape, TextColor, TypographyEngine } from './types';
import { generatePlaqueDesign, generateRealisticView, GenerationPhase } from './services/geminiService';
import { downloadCorelSvg, downloadPdf, svgToPngBase64, svgToProofPngBase64 } from './services/exportService';
import { getInscriptionLayout } from './services/inscriptionLayout';
import { estimatePlaquePrice } from './services/pricing';
import { DEFAULT_PRODUCT_SLUG, DeliveryAddress, MockOrder, ProductFamily, SiteView, getLandingPageBySlug, getPlaqueSummaryTitle, getProductBySlug, makeMockOrder, productFamilies, seoLandingPages } from './services/commerce';
import { isBenchPlaqueFormat } from './services/plaqueRules';
import { BENCH_SAFE_MARGIN_PERCENT } from './services/safeMargin';
import {
  decodeInlineProofResumeToken,
  getInlineProofResumeToken,
} from './services/proofResume';

const ThreePlaquePreview = lazy(async () => {
  const module = await import('./components/ThreePlaquePreview');
  return { default: module.ThreePlaquePreview };
});

const SUPPORTED_MEMORIAL_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

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
  '/': 'home',
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
  returns: '/returns-and-cancellations',
  plaque: '/design',
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

const isCheckoutRecoveryRoute = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return window.location.pathname === '/checkout' && Boolean(params.get('order'));
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
  generatedSvgContent: null,
  aiReasoning: null,
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

  const [state, setState] = useState<PlaqueState>(PROOF_BENCH_INITIAL_STATE);
  const [inscriptionPrompt, setInscriptionPrompt] = useState('');
  const [inscriptionGuidance, setInscriptionGuidance] = useState('');
  const [generatedLayoutSignature, setGeneratedLayoutSignature] = useState<string | null>(null);
  const [generatedProofFrame, setGeneratedProofFrame] = useState<GeneratedProofFrame | null>(null);
  const [checkoutRecoveryLoading, setCheckoutRecoveryLoading] = useState(isCheckoutRecoveryRoute);
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

  const svgRef = useRef<SVGSVGElement>(null);
  const controlsScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { controlsScrollRef.current?.scrollTo({ top: 0 }); }, [activeStep]);
  const selectedProduct = getProductBySlug(selectedProductSlug);
  const selectedLanding = getLandingPageBySlug(selectedLandingSlug);
  useSeoMeta(currentView, selectedProduct, selectedLanding);

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
    try {
      const savedOrders = localStorage.getItem('plaques-ai-mock-orders');
      if (savedOrders) {
        setMockOrders(JSON.parse(savedOrders));
      }
    } catch {
      setMockOrders([]);
    }

    let cancelled = false;
    const loadHubOrders = async () => {
      const params = new URLSearchParams(window.location.search);
      const shouldLoadHubOrders = window.location.pathname === '/admin' || params.get('mockHub') === '1';
      if (!shouldLoadHubOrders) return;

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
  }, []);

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
    const inlineToken = getInlineProofResumeToken();
    const orderId = new URLSearchParams(window.location.search).get('order');
    if (window.location.pathname === '/checkout' && orderId) return;
    if (!token && !inlineToken) return;

    let cancelled = false;
    const loadProofSession = async () => {
      try {
        let proofSession;
        if (inlineToken) {
          const inlineProof = await decodeInlineProofResumeToken(inlineToken);
          proofSession = {
            plaque_state: inlineProof.plaqueState,
            wording: inlineProof.wording,
            generated_svg: inlineProof.generatedSvg,
            ai_reasoning: null,
            metadata: {
              inscriptionGuidance: inlineProof.inscriptionGuidance,
              layoutIsCurrent: inlineProof.layoutIsCurrent,
            },
          };
        } else {
          const response = await fetch(`/api/proof-sessions/${encodeURIComponent(token || '')}`);
          if (!response.ok) throw new Error(`Could not load proof session (${response.status})`);
          const payload = await response.json();
          proofSession = payload.proofSession;
        }
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
          restoredState.generatedSvgContent && proofSession.metadata?.layoutIsCurrent !== false
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
      }
    };

    loadProofSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (window.location.pathname !== '/checkout') return;
    const checkoutParams = new URLSearchParams(window.location.search);
    const orderId = checkoutParams.get('order');
    const recoveryToken = checkoutParams.get('proof');
    if (!orderId) {
      setCheckoutRecoveryLoading(false);
      return;
    }

    let cancelled = false;
    const restoreCheckoutOrder = async () => {
      setCheckoutRecoveryLoading(true);
      try {
        const recoveryQuery = recoveryToken ? `?proof=${encodeURIComponent(recoveryToken)}` : '';
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}${recoveryQuery}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not load order (${response.status})`);
        const order = payload.order;
        if (!order || cancelled) return;

        let locallySavedOrder: MockOrder | undefined;
        try {
          const savedOrders = JSON.parse(localStorage.getItem('plaques-ai-mock-orders') || '[]') as MockOrder[];
          locallySavedOrder = savedOrders.find((savedOrder) => savedOrder.id === order.id);
        } catch {
          // The protected server snapshot remains available when local recovery data is unavailable.
        }

        const restoredState: PlaqueState = {
          ...PROOF_BENCH_INITIAL_STATE,
          ...(locallySavedOrder?.state || order.plaqueState || order.state || {}),
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
        setActiveStep(steps.length - 1);
        setProofSaved(true);
        setBasketAdded(true);
        setMockOrders(prev => {
          if (prev.some(savedOrder => savedOrder.id === order.id)) return prev;
          return [order, ...prev];
        });
      } catch (error) {
        console.warn('Could not restore cancelled checkout order.', error);
      } finally {
        if (!cancelled) setCheckoutRecoveryLoading(false);
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
      // Layout must never silently rewrite the customer's approved wording.
      const effectivePrompt = prompt;

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
          aiReasoning: result.reasoning
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

  const hasCurrentLayout = !!state.generatedSvgContent
    && generatedLayoutSignature === getLayoutSignature(inscriptionPrompt);
  const readinessWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    if (!state.generatedSvgContent) {
      warnings.push('Generate your inscription layout. The preview is still showing guide text.');
    }
    if (state.generatedSvgContent && !hasCurrentLayout) {
      warnings.push('Your wording or layout options have changed. Generate a fresh proof before ordering.');
    }
    if (state.memorialImageEnabled && state.memorialImageMethod === MemorialImageMethod.Engraved && !state.memorialImageSvg) {
      warnings.push('Generate the engraved artwork.');
    }
    if (state.memorialImageEnabled && state.memorialImageMethod === MemorialImageMethod.UvPrinted && !state.memorialImageSourceUrl && !state.memorialImagePreviewUrl) {
      warnings.push('Upload the full-colour artwork.');
    }
    return warnings;
  }, [hasCurrentLayout, state.generatedSvgContent, state.memorialImageEnabled, state.memorialImageMethod, state.memorialImagePreviewUrl, state.memorialImageSourceUrl, state.memorialImageSvg]);

  const layoutRegenNotice = React.useMemo(() => {
    if (!state.generatedSvgContent || !generatedProofFrame) return null;
    const currentFrame = getProofFrame(state);
    if (generatedProofFrame.orientation !== currentFrame.orientation) {
      return {
        tone: 'orientation' as const,
        message: `You switched from ${generatedProofFrame.orientation} to ${currentFrame.orientation}. Regenerate your layout to fit the new shape before ordering.`,
      };
    }
    if (generatedProofFrame.width !== currentFrame.width || generatedProofFrame.height !== currentFrame.height) {
      return {
        tone: 'size' as const,
        message: 'Size changed since the text was generated. Regenerate your layout to fit the new size before ordering.',
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
      label: hasCurrentLayout
        ? 'Inscription layout is generated'
        : state.generatedSvgContent
          ? 'Regenerate your inscription layout'
          : 'Generate your inscription layout',
      ready: hasCurrentLayout,
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
            layoutIsCurrent: hasCurrentLayout,
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
      console.error('Remote PDF resume link could not be created.', error);
      window.alert('The proof PDF could not be saved right now. Please try again shortly so its QR code can open a reliable saved proof.');
      return;
    }
    if (!continueUrl) {
      window.alert('The proof PDF could not be saved right now. Please try again shortly.');
      return;
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
    if (view === 'checkout' && currentView === 'plaque') {
      goToProof();
      return;
    }
    if (view === 'product' && productSlug) {
      setSelectedProductSlug(productSlug);
    }
    if (view === 'landing' && productSlug) {
      setSelectedLandingSlug(productSlug);
    }
    setCurrentView(view);
    const route = (view === 'product' || view === 'landing') && productSlug ? `/${productSlug}` : viewRoutes[view];
    if (route && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
  };

  const handleStartDesign = () => {
    setState(PROOF_BENCH_INITIAL_STATE);
    setInscriptionPrompt('');
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
    if (window.location.pathname !== '/design') {
      window.history.pushState({}, '', '/design');
    }
  };

  const handleLaunchProduct = (product: ProductFamily) => {
    setSelectedProductSlug(product.slug);
    setHasSelectedSize(true);
    setState(prev => {
      const next = {
        ...PROOF_BENCH_INITIAL_STATE,
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
    setInscriptionPrompt('');
    setInscriptionGuidance('');
    setGeneratedImage(null);
    setRealisticReferenceImage(null);
    setMemorialSourceImage(null);
    setMemorialStatus(null);
    setGeneratedLayoutSignature(null);
    setGeneratedProofFrame(null);
    setProofSaved(false);
    setBasketAdded(false);
    setCurrentView('plaque');
    setActiveStep(5);
    if (window.location.pathname !== '/design') {
      window.history.pushState({}, '', '/design');
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
    if (order.stripeSimulation.provider !== 'mock') return;
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
          orderSnapshot: {
            ...order,
            state: {
              ...order.state,
              generatedSvgContent: null,
              memorialImageSvg: null,
              memorialImageSourceUrl: null,
              memorialImagePreviewUrl: null,
              conceptImageUrl: null,
              etchmasterStyleReferenceUrl: null,
              aiReasoning: null,
            },
            proofPackage: {
              ...order.proofPackage,
              productionSvg: order.proofPackage.productionSvg,
              visualProofSvg: order.proofPackage.visualProofSvg,
              visualProofPng: null,
            },
          },
        }),
      });
      window.clearTimeout(timeout);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Stripe checkout failed (${response.status})`);
      const session = payload.session;
      const serverOrder = payload.order;
      if (session?.id && (session?.url || session?.clientSecret)) {
        const serverOrderId = serverOrder?.id || order.id;
        checkoutOrder = {
          ...order,
          id: serverOrderId,
          createdAt: serverOrder?.createdAt || order.createdAt,
          productTitle: serverOrder?.productTitle || order.productTitle,
          total: Number.isInteger(serverOrder?.totalPence) ? serverOrder.totalPence / 100 : order.total,
          priceBreakdown: serverOrder?.priceBreakdown || order.priceBreakdown,
          status: serverOrder?.status === 'checkout_started'
            ? 'checkout-started'
            : serverOrder?.status || 'checkout-started',
          paymentStatus: serverOrder?.paymentStatus || 'unpaid',
          state: order.state,
          proofPackage: {
            ...(serverOrder?.proofPackage || {}),
            productionSvg: null,
            visualProofSvg: null,
            visualProofPng: null,
            productionFilename: `${serverOrderId}-production-proof.svg`,
            visualFilename: `${serverOrderId}-visual-proof.svg`,
            lockedAt: serverOrder?.proofPackage?.lockedAt || order.proofPackage.lockedAt,
          },
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
  const stepShortLabels = ['Size', 'Material', 'Colour', 'Fixings', 'Backing', 'Wording', 'Review'];
  const stepTitles = ['Choose your size', 'Find your finish', 'Make it stand out', 'The finishing touches', 'Add a wood backing', 'Words that matter', 'Your final review'];
  const stepDescriptions = ['A little dedication or a larger tribute. Find the right fit.', 'Explore brass and stainless steel finishes.', 'Choose the colour of your engraved wording.', 'Choose a border and how your plaque will be mounted.', 'An optional frame for your words.', 'Add your inscription, then create a layout.', 'Check every detail before placing your order.'];
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

  const formattedPrice = (() => {
    const hasPence = Math.round(price * 100) % 100 !== 0;
    return price.toLocaleString('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: hasPence ? 2 : 0,
      maximumFractionDigits: hasPence ? 2 : 0,
    });
  })();
  const showHeaderPrice = currentView === 'plaque';
  const proofSpecTrail = getPlaqueSummaryTitle({ material: state.material });

  return (
    <div className={`studio-app-shell proofbench-app flex flex-col bg-transparent text-[#eef4ee] ${currentView !== 'plaque' ? 'commerce-mode' : 'designer-mode'}`}>
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
            checkoutRecoveryLoading={checkoutRecoveryLoading}
            orders={mockOrders}
            onNavigate={handleNavigate}
            onStartDesign={handleStartDesign}
            onLaunchProduct={handleLaunchProduct}
            onCreateMockOrder={handleCreateMockOrder}
          />
        ) : (
          <div className="app-fade-in proofbench-board">
            <nav className="designer-steps no-print" aria-label="Plaque design steps">
              <div className="designer-steps-list">
                {steps.map((label, index) => (
                  <button
                    key={label}
                    onClick={() => setActiveStep(index)}
                    aria-label={`Go to ${label}`}
                    aria-current={index === activeStep ? 'step' : undefined}
                    className={`designer-step ${index === activeStep ? 'is-active' : ''}`}
                  >
                    <span className="designer-step-number">{index + 1}</span>
                    <span>{stepShortLabels[index]}</span>
                  </button>
                ))}
              </div>
            </nav>

            <aside className="proofbench-customiser no-print" aria-label="Plaque options">
              <div className="proofbench-customiser-head">
                <p className="designer-eyebrow">Make it yours <span>Step {activeStep + 1} of 7</span></p>
                <h1>{stepTitles[activeStep]}</h1>
                <p>{stepDescriptions[activeStep]}</p>
              </div>
              <div className="proofbench-control-scroll" ref={controlsScrollRef}>
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
                  onRealisticPreview={handleRealPreview}
                  realisticPreviewPrompt={realisticPreviewPrompt}
                  onRealisticPreviewPromptChange={setRealisticPreviewPrompt}
                  realisticPreviewAspectRatio={realisticPreviewAspectRatio}
                  onRealisticPreviewAspectRatioChange={setRealisticPreviewAspectRatio}
                  onExportSvg={handleExportSvg}
                  onExportPdf={handleExportPdf}
                  onPrint={handleNativePrint}
                />
              </div>
              <div className="designer-step-footer">
                <button type="button" onClick={goBack} disabled={!canGoBack} className="designer-back">← Back</button>
                {canGoNext ? (
                  <button type="button" onClick={goNext} className="designer-continue">Continue to {stepShortLabels[activeStep + 1].toLowerCase()} <span aria-hidden="true">→</span></button>
                ) : <span className="designer-review-note">Made to your design</span>}
              </div>
            </aside>

            <section className={`proofbench-stage relative min-h-0 min-w-0 overflow-hidden ${isProofExpanded ? 'is-expanded' : ''}`} aria-label="Your plaque preview">
              <div className="designer-stage-heading no-print">
                <div><span className="designer-eyebrow">Your creation</span><h2>Your plaque, taking shape.</h2></div>
                <span className="designer-live-indicator">Live preview</span>
              </div>
              <div className="designer-stage-caption no-print"><strong>{state.width} × {state.height} mm</strong><span>{proofSpecTrail}</span></div>
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
                {isProofExpanded ? '×' : '⛶'}
              </button>
            </section>

          </div>
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
