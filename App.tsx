import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import PlaquePreview from './components/PlaquePreview';
import { Controls } from './components/Controls';
import { RealisticPreviewModal } from './components/RealisticPreviewModal';
import { SiteExperience } from './components/SiteExperience';
import { BorderStyle, DesignStyle, EtchmasterImageMode, EtchmasterShapeMask, Fixing, INITIAL_STATE, Material, MemorialImageMethod, MemorialImagePlacement, MemorialImageShape, PlaqueState, Shape, TextColor, TypographyEngine } from './types';
import { generatePlaqueDesign, generateRealisticView, GenerationPhase } from './services/geminiService';
import { downloadCorelSvg, downloadPdf, svgToPngBase64 } from './services/exportService';
import { getInscriptionLayout } from './services/inscriptionLayout';
import { estimatePlaquePrice } from './services/pricing';
import { MockOrder, ProductFamily, SiteView, getProductBySlug, makeMockOrder, productFamilies } from './services/commerce';
import { isBenchPlaqueFormat } from './services/plaqueRules';

const VectorSketch = lazy(async () => {
  const module = await import('./components/VectorSketch');
  return { default: module.VectorSketch };
});

const ThreePlaquePreview = lazy(async () => {
  const module = await import('./components/ThreePlaquePreview');
  return { default: module.ThreePlaquePreview };
});

const SUPPORTED_MEMORIAL_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const DELIVERY_HELP = 'UK mainland only. Highlands, islands and non-UK delivery may incur extra charges.';

const PROOF_BENCH_INITIAL_STATE: PlaqueState = {
  ...INITIAL_STATE,
  width: 297,
  height: 210,
  material: Material.BrushedBrass,
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
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  returns: '/returns-and-cancellations',
  plaque: '/design',
};

const getInitialView = (): SiteView => {
  if (typeof window === 'undefined') return 'home';
  return routeViews[window.location.pathname] ?? 'home';
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
  const [selectedProductSlug, setSelectedProductSlug] = useState(productFamilies[0].slug);
  const [mockOrders, setMockOrders] = useState<MockOrder[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [hasSelectedSize, setHasSelectedSize] = useState(false);

  const [state, setState] = useState<PlaqueState>(PROOF_BENCH_INITIAL_STATE);
  const [inscriptionPrompt, setInscriptionPrompt] = useState('');
  const [inscriptionGuidance, setInscriptionGuidance] = useState('');
  const [generatedLayoutSignature, setGeneratedLayoutSignature] = useState<string | null>(null);
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
  const [isGeneratingMemorial, setIsGeneratingMemorial] = useState(false);
  const [memorialStatus, setMemorialStatus] = useState<string | null>(null);
  const [proofSaved, setProofSaved] = useState(false);
  const [basketAdded, setBasketAdded] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const selectedProduct = getProductBySlug(selectedProductSlug);

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
  }, []);

  useEffect(() => {
    const handlePopState = () => {
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
    if (state.etchmasterMode !== EtchmasterImageMode.Prompt && !memorialSourceImage) {
      alert('Upload artwork first.');
      return;
    }
    if (state.etchmasterMode === EtchmasterImageMode.SubjectStyle && !state.etchmasterStyleReferenceUrl) {
      alert('Upload a style reference image first.');
      return;
    }

    setIsGeneratingMemorial(true);
    setMemorialStatus(state.etchmasterEnhancePrompt ? 'Enhancing EtchMaster prompt...' : 'Preparing detailed etchable artwork...');

    try {
      const { enhanceEtchingPrompt, generateMemorialEngraving, vectorizeMemorialImage } = await import('./services/memorialImageService');
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
      const inscriptionBox = getInscriptionLayout(state, prompt);
      const result = await generatePlaqueDesign(
        prompt,
        state.width,
        state.height,
        state.shape,
        state.designStyle,
        null,
        (phase) => setGenerationPhase(phase),
        { width: inscriptionBox.textW, height: inscriptionBox.textH },
        getInscriptionContext(prompt),
        TypographyEngine.GeminiAuthored
      );

      if (result) {
        setGeneratedLayoutSignature(getLayoutSignature(prompt));
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

  const readinessWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    if (!state.generatedSvgContent) {
      warnings.push('Generate your inscription layout. The preview is still showing guide text.');
    } else if (generatedLayoutSignature !== getLayoutSignature(inscriptionPrompt)) {
      warnings.push('Update the inscription layout after your latest plaque changes.');
    }
    if (state.memorialImageEnabled && state.memorialImageMethod === MemorialImageMethod.Engraved && !state.memorialImageSvg) {
      warnings.push('Generate the engraved artwork.');
    }
    if (state.memorialImageEnabled && state.memorialImageMethod === MemorialImageMethod.UvPrinted && !state.memorialImageSourceUrl && !state.memorialImagePreviewUrl) {
      warnings.push('Upload the full-colour artwork.');
    }
    return warnings;
  }, [generatedLayoutSignature, inscriptionGuidance, inscriptionPrompt, state.designStyle, state.generatedSvgContent, state.height, state.memorialImageEnabled, state.memorialImageMethod, state.memorialImagePlacement, state.memorialImagePreviewUrl, state.memorialImageScale, state.memorialImageShape, state.memorialImageSourceUrl, state.memorialImageSvg, state.shape, state.typographyEngine, state.width]);

  const isProductionReady = readinessWarnings.length === 0;
  const readinessItems = [
    {
      label: state.generatedSvgContent
        ? generatedLayoutSignature === getLayoutSignature(inscriptionPrompt)
          ? 'Inscription layout is up to date'
          : 'Update the inscription layout after your latest changes'
        : 'Generate your inscription layout',
      ready: !!state.generatedSvgContent && generatedLayoutSignature === getLayoutSignature(inscriptionPrompt),
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
    await downloadPdf(svgRef.current, state, { continueUrl });
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

  const handleAddToBasket = () => {
    if (!isProductionReady) {
      goToProof();
      return;
    }
    setBasketAdded(true);
    setCurrentView('checkout');
  };

  const handleNavigate = (view: SiteView, productSlug?: string) => {
    if (productSlug) {
      setSelectedProductSlug(productSlug);
    }
    setCurrentView(view);
    const route = viewRoutes[view];
    if (route && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
  };

  const handleStartDesign = () => {
    setState(PROOF_BENCH_INITIAL_STATE);
    setInscriptionPrompt('');
    setInscriptionGuidance('');
    setGeneratedLayoutSignature(null);
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
        ...prev,
        ...product.preset,
        generatedSvgContent: null,
        aiReasoning: null,
        conceptImageUrl: null,
      };
      if (isBenchPlaqueFormat(next.width, next.height, next.shape)) {
        next.wood = false;
        next.fixingHoleCount = 2;
      }
      return next;
    });
    setInscriptionPrompt(product.proofPrompt);
    setGeneratedLayoutSignature(null);
    setProofSaved(false);
    setBasketAdded(false);
    setCurrentView('plaque');
    setActiveStep(0);
    if (window.location.pathname !== '/design') {
      window.history.pushState({}, '', '/design');
    }
  };

  const handleCreateMockOrder = (customerName: string, customerEmail: string) => {
    const order = makeMockOrder(state, inscriptionPrompt, selectedProduct.title, customerName, customerEmail);
    setMockOrders(prev => {
      const next = [order, ...prev];
      try {
        localStorage.setItem('plaques-ai-mock-orders', JSON.stringify(next));
      } catch {
        // Non-critical: the in-memory order still exists for this prototype session.
      }
      return next;
    });
    return order;
  };

  // --- Render ---
  const steps = ['Material', 'Size/Shape', 'Colour', 'Fixings and border', 'Wood', 'Text', 'Proof'];
  const stepShortLabels = ['Material', 'Size', 'Colour', 'Fixings', 'Wood', 'Text', 'Proof'];
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

  const stepIcons = ['▦', '◉', '●', '⌁', '▥', 'T', '✓'];
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
  const showHeaderPrice = currentView === 'plaque' ? hasSelectedSize : currentView === 'product' || currentView === 'checkout';
  const materialTrailLabels: Record<Material, string> = {
    [Material.BrushedBrass]: 'Brushed brass',
    [Material.OrbitalBrassMattLacquer]: 'Orbital brass',
    [Material.PolishedBrass]: 'Polished brass',
    [Material.AgedBrass]: 'Aged brass',
    [Material.BrushedSteel]: 'Brushed stainless',
    [Material.PolishedSteel]: 'Polished stainless',
  };
  const fixingTrailLabels: Record<Fixing, string> = {
    [Fixing.None]: 'No fixings',
    [Fixing.VHB]: 'VHB tape',
    [Fixing.Screws]: 'Screws',
    [Fixing.Caps]: 'Decoration caps',
  };
  const textTrailLabels: Record<TextColor, string> = {
    [TextColor.Black]: 'Black text',
    [TextColor.Grey]: 'Grey text',
    [TextColor.White]: 'White text',
    [TextColor.Cream]: 'Cream text',
  };
  const proofSpecTrail = [
    materialTrailLabels[state.material],
    fixingTrailLabels[state.fixing],
    textTrailLabels[state.textColor],
  ].join(' / ');

  return (
    <div className={`studio-app-shell proofbench-app flex flex-col bg-transparent text-[#eef4ee] ${currentView !== 'plaque' && currentView !== 'vector' ? 'commerce-mode' : ''}`}>
      <Header
        onNavigate={handleNavigate}
        onStartDesign={handleStartDesign}
        currentView={currentView}
        priceLabel={formattedPrice}
        showPrice={showHeaderPrice}
      />

      <main className={`min-h-0 w-full flex-1 ${currentView === 'plaque' || currentView === 'vector' ? 'overflow-hidden' : 'overflow-auto'}`}>

        {currentView !== 'plaque' && currentView !== 'vector' ? (
          <SiteExperience
            view={currentView}
            selectedProduct={selectedProduct}
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
        ) : currentView === 'vector' ? (
          <div className="h-full overflow-hidden p-3 md:p-4">
            <Suspense fallback={<div className="studio-panel rounded-lg p-6 font-bold text-[#4c554f]">Loading artwork studio...</div>}>
              <VectorSketch />
            </Suspense>
          </div>
        ) : (
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
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b66a]">Selected Controls</p>
                  <h2 className="mt-1 text-base font-black text-[#f7f1e3]">{steps[activeStep]}</h2>
                </div>
                <button className="proofbench-kebab" aria-label="More options" type="button">⋮</button>
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
            </aside>

            <section className={`proofbench-stage relative row-start-1 min-h-0 min-w-0 overflow-hidden md:col-start-3 md:row-start-1 ${isProofExpanded ? 'is-expanded' : ''}`}>
              <div className="proofbench-mobile-top no-print md:hidden">
                <button type="button" className="proofbench-mobile-brand" onClick={() => handleNavigate('home')}>
                  <span className="brand-wordmark brand-wordmark--mobile-tool">
                    <span>Insta</span><span>Plaque</span>
                  </span>
                  <small title={proofSpecTrail}>{proofSpecTrail}</small>
                </button>
                {showProofPrice && (
                  <div className="proofbench-mobile-price" aria-label={`Current price ${formattedPrice} including UK delivery`}>
                    <span className="proofbench-delivery-label">
                      Inc UK delivery
                      <button type="button" className="proofbench-info-dot" aria-label={DELIVERY_HELP} title={DELIVERY_HELP}>
                        i
                      </button>
                    </span>
                    <strong>
                      <svg className="proofbench-price-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.4 8.5h11.2l-.8 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.4 8.5Z" />
                        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
                      </svg>
                      {formattedPrice}
                    </strong>
                  </div>
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
