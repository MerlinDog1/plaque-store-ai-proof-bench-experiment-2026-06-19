import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DesignStyle,
  EtchmasterImageMode,
  EtchmasterImageModel,
  EtchmasterImagePreset,
  EtchmasterShapeEdge,
  EtchmasterShapeMask,
  Fixing,
  Material,
  MemorialImageMethod,
  MemorialImagePlacement,
  MemorialImageShape,
  PlaqueState,
  Shape,
  STYLE_FONT_PALETTES,
  TextColor,
  AVAILABLE_FONTS,
  BorderStyle,
} from '../types';
import type { GenerationPhase } from '../services/geminiService';
import { DEFAULT_SAFE_MARGIN_PERCENT, SAFE_MARGIN_PRESETS, getSafeMarginMm, getSafeMarginPercent } from '../services/safeMargin';
import { isBenchPlaqueFormat } from '../services/plaqueRules';
import { estimatePlaqueBasePrice, estimateWoodAddOn } from '../services/pricing';

const BENCH_SAFE_MARGIN_PERCENT = 7;

const MATERIAL_LABELS: Record<Material, string> = {
  [Material.BrushedBrass]: 'Brushed brass',
  [Material.OrbitalBrassMattLacquer]: 'Orbital brass',
  [Material.PolishedBrass]: 'Polished brass',
  [Material.AgedBrass]: 'Aged brass',
  [Material.BrushedSteel]: 'Brushed stainless',
  [Material.PolishedSteel]: 'Polished stainless',
};

const MATERIAL_NOTES: Record<Material, string> = {
  [Material.BrushedBrass]: 'Hand-brushed satin brass with warm low-glare grain',
  [Material.OrbitalBrassMattLacquer]: 'Matt lacquered orbital brass with optional colour-filled etch',
  [Material.PolishedBrass]: 'Mirror-bright traditional presentation brass',
  [Material.AgedBrass]: 'Heritage patina with darker engraving',
  [Material.BrushedSteel]: 'Directional satin stainless with fine linear grain',
  [Material.PolishedSteel]: 'Mirror stainless with crisp reflected highlights',
};

const MATERIAL_SWATCH: Record<Material, string> = {
  [Material.BrushedBrass]: 'repeating-linear-gradient(0deg,rgba(255,238,176,.22) 0 1px,rgba(79,49,11,.14) 1px 2px,transparent 2px 5px),linear-gradient(135deg,#9f6e20,#c89b48,#8b5d18)',
  [Material.OrbitalBrassMattLacquer]: 'repeating-radial-gradient(circle at 42% 38%,rgba(255,244,194,.32) 0 1px,rgba(84,67,37,.15) 1px 2px,transparent 2px 5px),linear-gradient(135deg,#d8c17b,#9e824a,#c8af6a)',
  [Material.PolishedBrass]: 'linear-gradient(135deg,#744307 0%,#ffc43f 18%,#fff5b5 30%,#9c5a08 43%,#fff8c4 57%,#b86d0c 70%,#6b3b05 100%)',
  [Material.AgedBrass]: 'linear-gradient(135deg,#302315,#8c7034,#c0a158,#604822,#2a1d12)',
  [Material.BrushedSteel]: 'repeating-linear-gradient(0deg,rgba(255,255,255,.22) 0 1px,rgba(55,67,75,.14) 1px 2px,transparent 2px 5px),linear-gradient(135deg,#7a858b,#c7d0d4,#68727a)',
  [Material.PolishedSteel]: 'linear-gradient(135deg,#4a535b 0%,#d7dde1 15%,#ffffff 26%,#8c969e 38%,#f2f6f8 55%,#727d86 72%,#39434b 100%)',
};

const MATERIAL_ORDER: Material[] = [
  Material.BrushedSteel,
  Material.PolishedSteel,
  Material.PolishedBrass,
  Material.BrushedBrass,
  Material.OrbitalBrassMattLacquer,
  Material.AgedBrass,
];

const BORDER_STYLE_OPTIONS: { value: BorderStyle; label: string; note: string }[] = [
  { value: BorderStyle.Single, label: 'Single', note: 'One clean engraved keyline' },
  { value: BorderStyle.Double, label: 'Double', note: 'Two balanced inset lines' },
  { value: BorderStyle.Scalloped, label: 'Scalloped', note: 'Border sweeps around caps or screws' },
  { value: BorderStyle.DoubleScalloped, label: 'Double scalloped', note: 'Two cut-out lines around fixings' },
];

type SizePreset = {
  label: string;
  note: string;
  shape: Shape;
  width: number;
  height: number;
  badge?: string;
};

const SIZE_PRESETS: SizePreset[] = [
  { label: 'A5 landscape', note: '210 x 148mm · Most popular', shape: Shape.Rect, width: 210, height: 148 },
  { label: 'A5 portrait', note: '148 x 210mm · Door or wall', shape: Shape.Rect, width: 148, height: 210 },
  { label: 'A4 landscape', note: '297 x 210mm · Longer tributes', shape: Shape.Rect, width: 297, height: 210 },
  { label: 'A4 portrait', note: '210 x 297mm · Door or wall', shape: Shape.Rect, width: 210, height: 297 },
  { label: 'Wall plaque', note: '200 x 150mm · General purpose', shape: Shape.Rect, width: 200, height: 150 },
];

const BENCH_SIZE_PRESETS: SizePreset[] = [
  { label: '150 x 50 mm', note: 'Current compact bench default', shape: Shape.Rect, width: 150, height: 50, badge: 'Default' },
  { label: '225 x 75 mm', note: 'Wider commemorative bench plaque', shape: Shape.Rect, width: 225, height: 75, badge: 'Most popular' },
  { label: '225 x 65 mm', note: 'Wide low-profile bench plaque', shape: Shape.Rect, width: 225, height: 65 },
  { label: '150 x 75 mm', note: 'Compact deeper bench plaque', shape: Shape.Rect, width: 150, height: 75 },
  { label: '150 x 65 mm', note: 'Compact balanced bench plaque', shape: Shape.Rect, width: 150, height: 65 },
  { label: '200 x 50 mm', note: 'Long narrow bench strip', shape: Shape.Rect, width: 200, height: 50 },
  { label: '125 x 50 mm', note: 'Small bench or seat strip', shape: Shape.Rect, width: 125, height: 50 },
];

const MIN_CUSTOM_DIMENSION_MM = 50;
const MAX_CUSTOM_DIMENSION_MM = 600;
const CUSTOM_FAST_TURNAROUND_WIDTH_MM = 600;
const CUSTOM_FAST_TURNAROUND_HEIGHT_MM = 400;
const getDefaultCapSize = (width: number, height: number, shape: Shape) => {
  if (shape === Shape.Heart) return 10;
  return Math.max(width, height) >= 297 && Math.min(width, height) >= 210 ? 15 : 10;
};

const fitsCustomFastTurnaround = (width: number, height: number) => {
  const longest = Math.max(width, height);
  const shortest = Math.min(width, height);
  return longest <= CUSTOM_FAST_TURNAROUND_WIDTH_MM && shortest <= CUSTOM_FAST_TURNAROUND_HEIGHT_MM;
};

const STEP_COPY = [
  {
    eyebrow: 'Step 1 of 7',
    title: 'Material',
    detail: 'Choose the metal finish first so size prices reflect the selected material.',
  },
  {
    eyebrow: 'Step 2 of 7',
    title: 'Size/Shape',
    detail: 'Choose a standard plaque size with live starting prices, or open custom size.',
  },
  {
    eyebrow: 'Step 3 of 7',
    title: 'Colour',
    detail: 'Choose the engraved text colour used in the proof and production file.',
  },
  {
    eyebrow: 'Step 4 of 7',
    title: 'Fixings and border',
    detail: 'Set the border and production mounting method together.',
  },
  {
    eyebrow: 'Step 5 of 7',
    title: 'Wood',
    detail: 'Choose whether the plaque needs a timber backing board and edge finish.',
  },
  {
    eyebrow: 'Step 6 of 7',
    title: 'Text',
    detail: 'Enter the tribute text and choose a style. The layout assistant fits it to the available space.',
  },
  {
    eyebrow: 'Step 7 of 7',
    title: 'Proof',
    detail: 'Review the production proof, realistic render, and export options before basket.',
  },
];

interface Props {
  state: PlaqueState;
  onChange: (newState: Partial<PlaqueState>) => void;
  onGenerate: (text: string) => void;
  onClear: () => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  guidance: string;
  onGuidanceChange: (guidance: string) => void;
  onGeneratedSvgContentChange: (svgContent: string) => void;
  isGenerating: boolean;
  generationPhase: GenerationPhase;
  onMemorialImageUpload: (file: File) => void;
  onStyleReferenceUpload: (file: File) => void;
  onGenerateMemorialImage: () => void;
  onClearMemorialImage: () => void;
  isGeneratingMemorialImage: boolean;
  memorialStatus: string | null;
  activeStep: number;
  onSizeSelected: () => void;
  showMaterialPrices: boolean;
  price: number;
  readinessItems: { label: string; ready: boolean; step: number }[];
  isProductionReady: boolean;
  basketAdded: boolean;
  onGoToStep: (step: number) => void;
  onSaveProof: () => void;
  onAddToBasket: () => void;
  onRealisticPreview: () => void;
  realisticPreviewPrompt: string;
  onRealisticPreviewPromptChange: (prompt: string) => void;
  realisticPreviewAspectRatio: string;
  onRealisticPreviewAspectRatioChange: (aspectRatio: string) => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
}

const REALISTIC_ASPECT_RATIOS = [
  ['auto', 'Auto product fit'],
  ['16:9', 'Hero wide'],
  ['1:1', 'Square'],
  ['4:3', 'Landscape'],
  ['3:4', 'Portrait'],
  ['9:16', 'Story'],
];

const INSTANT_STYLE_OPTIONS: { variant: number; label: string; style: Exclude<DesignStyle, DesignStyle.Auto> | null; title: string }[] = [
  { variant: 1, label: '1', style: null, title: 'Original generated style' },
  { variant: 2, label: '2', style: DesignStyle.ClassicalFormal, title: 'Try a classical style' },
  { variant: 3, label: '3', style: DesignStyle.ModernMinimal, title: 'Try a modern style' },
  { variant: 4, label: '4', style: DesignStyle.MemorialSolemn, title: 'Try a softer memorial style' },
  { variant: 5, label: '5', style: DesignStyle.ContemporaryBold, title: 'Try a bolder style' },
];

const instantStyleLetterSpacing: Partial<Record<DesignStyle, { title: string; body: string; date: string }>> = {
  [DesignStyle.ClassicalFormal]: { title: "0.04em", body: "0", date: "0.06em" },
  [DesignStyle.ModernMinimal]: { title: "0.08em", body: "0", date: "0.08em" },
  [DesignStyle.MemorialSolemn]: { title: "0.03em", body: "0", date: "0.05em" },
  [DesignStyle.ContemporaryBold]: { title: "0.06em", body: "0", date: "0.06em" },
  [DesignStyle.HeritagePlaque]: { title: "0.05em", body: "0", date: "0.08em" },
};

interface GeneratedTextControl {
  index: number;
  label: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
}

const fieldClass =
  'control-input w-full min-h-[48px] rounded-lg border px-4 py-3 text-base text-[#1b231f] placeholder:text-[#9b9284] outline-none transition focus:border-[#c6932e] focus:ring-4 focus:ring-[#b98235]/20 disabled:bg-[#eee4d4] disabled:text-[#8a8275]';

const choiceClass = (active: boolean) =>
  `control-choice studio-press min-h-[54px] rounded-lg border px-4 py-3 text-left text-sm font-black transition active:scale-[0.98] ${
    active
      ? 'is-active border-[#c6932e] bg-[#f2d688] text-[#1b231f] shadow-[0_10px_30px_rgba(216,177,95,0.14)]'
      : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#2f3832] hover:border-[#c6932e]/70 hover:bg-[#efe4d1]'
  }`;

const pillClass = (active: boolean) =>
  `control-pill studio-press min-h-[44px] rounded-lg border px-4 py-2 text-center text-sm font-black transition active:scale-[0.98] ${
    active ? 'is-active border-[#c6932e] bg-[#f2d688] text-[#1b231f]' : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#2f3832] hover:border-[#c6932e]/70 hover:bg-[#efe4d1]'
  }`;

const StepIntro = ({ step }: { step: number }) => (
  <div className="step-intro mb-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">{STEP_COPY[step].eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black leading-tight tracking-tight text-[#1b231f]">{STEP_COPY[step].title}</h2>
      </div>
      <span className="step-orbit">{step + 1}</span>
    </div>
    <p className="mt-2 text-sm leading-6 text-[#6a746d]">{STEP_COPY[step].detail}</p>
  </div>
);

const LayoutThumbnail = ({ layout }: { layout: MemorialImagePlacement }) => {
  const portrait = <span className="rounded bg-current opacity-35" />;
  const text = (
    <span className="flex flex-col justify-center gap-1">
      <span className="h-1 rounded-full bg-current opacity-50" />
      <span className="h-1 rounded-full bg-current opacity-35" />
      <span className="h-1 w-3/4 rounded-full bg-current opacity-35" />
    </span>
  );

  if (layout === MemorialImagePlacement.PortraitLeft) return <span className="grid h-full grid-cols-2 gap-1">{portrait}{text}</span>;
  if (layout === MemorialImagePlacement.PortraitRight) return <span className="grid h-full grid-cols-2 gap-1">{text}{portrait}</span>;
  if (layout === MemorialImagePlacement.PortraitFocus) return <span className="grid h-full grid-rows-[1fr_auto] gap-1">{portrait}<span className="mx-auto h-1 w-1/2 rounded-full bg-current opacity-40" /></span>;
  return <span className="grid h-full grid-rows-2 gap-1">{portrait}{text}</span>;
};

interface FineTuneControlProps {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  locked: boolean;
  onChange: (value: number) => void;
}

const clampControlValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const FineTuneControl = ({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  disabled = false,
  locked,
  onChange,
}: FineTuneControlProps) => {
  const controlDisabled = disabled || locked;
  const apply = (nextValue: number) => onChange(clampControlValue(nextValue, min, max));

  return (
    <div className={`rounded-lg border p-3 transition ${locked ? 'border-[#edf3ef]/12 bg-[#17231f]' : 'border-[#b98235]/28 bg-[#f4eadc]'}`}>
      <div className={`mb-2 flex items-center justify-between gap-3 text-xs font-black ${locked ? 'text-[#d4e0d9]' : 'text-[#5c6b63]'}`}>
        <span>{label}</span>
        <span>{valueLabel}</span>
      </div>
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <button
          type="button"
          disabled={controlDisabled}
          onClick={() => apply(value - step)}
          className={`h-11 rounded-lg border text-lg font-black disabled:cursor-not-allowed ${locked ? 'border-[#edf3ef]/12 bg-[#22302b] text-[#6f8178]' : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffdf7] text-[#9a6a16] disabled:opacity-45'}`}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={controlDisabled}
          onChange={(event) => apply(Number(event.target.value))}
          className="w-full accent-[#b98235] disabled:opacity-65"
          aria-label={label}
        />
        <button
          type="button"
          disabled={controlDisabled}
          onClick={() => apply(value + step)}
          className={`h-11 rounded-lg border text-lg font-black disabled:cursor-not-allowed ${locked ? 'border-[#edf3ef]/12 bg-[#22302b] text-[#6f8178]' : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffdf7] text-[#9a6a16] disabled:opacity-45'}`}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export const Controls: React.FC<Props> = ({
  state,
  onChange,
  onGenerate,
  onClear,
  prompt,
  onPromptChange,
  guidance,
  onGuidanceChange,
  onGeneratedSvgContentChange,
  isGenerating,
  generationPhase,
  onMemorialImageUpload,
  onStyleReferenceUpload,
  onGenerateMemorialImage,
  onClearMemorialImage,
  isGeneratingMemorialImage,
  memorialStatus,
  activeStep,
  onSizeSelected,
  showMaterialPrices,
  price,
  readinessItems,
  isProductionReady,
  basketAdded,
  onGoToStep,
  onSaveProof,
  onAddToBasket,
  onRealisticPreview,
  realisticPreviewPrompt,
  onRealisticPreviewPromptChange,
  realisticPreviewAspectRatio,
  onRealisticPreviewAspectRatioChange,
  onExportSvg,
  onExportPdf,
  onPrint,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const sizePresetStackRef = useRef<HTMLDivElement>(null);
  const inscriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const instantStyleApplyingRef = useRef(false);
  const [fineTuneUnlocked, setFineTuneUnlocked] = useState(false);
  const [sizeMode, setSizeMode] = useState<'standard' | 'custom'>('standard');
  const [benchSizesExpanded, setBenchSizesExpanded] = useState(true);
  const [customWidthInput, setCustomWidthInput] = useState(String(state.width));
  const [customHeightInput, setCustomHeightInput] = useState(String(state.height));
  const [fixingsBorderMode, setFixingsBorderMode] = useState<'fixings' | 'border'>('fixings');
  const [manualTextOpen, setManualTextOpen] = useState(false);
  const [turnaroundToast, setTurnaroundToast] = useState<string | null>(null);
  const [baseGeneratedSvgContent, setBaseGeneratedSvgContent] = useState<string | null>(null);
  const [instantStyleVariant, setInstantStyleVariant] = useState(1);
  const isIterating = !!state.generatedSvgContent;
  const portraitPreviewUrl = state.memorialImageMethod === MemorialImageMethod.UvPrinted
    ? state.memorialImageSourceUrl || state.memorialImagePreviewUrl
    : state.memorialImagePreviewUrl;
  const safeMarginPercent = getSafeMarginPercent(state.safeMargin);
  const safeMarginMm = getSafeMarginMm({
    width: state.width,
    height: state.height,
    shape: state.shape,
    safeMargin: state.safeMargin,
  });
  const pictureOffsetXLimit = Math.max(80, Math.ceil(state.width));
  const pictureOffsetYLimit = Math.max(80, Math.ceil(state.height));
  const resizeInscriptionTextarea = () => {
    const textarea = inscriptionTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 240), 360);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > nextHeight ? 'auto' : 'hidden';
  };
  const generatedTextControls = React.useMemo<GeneratedTextControl[]>(() => {
    if (!state.generatedSvgContent || typeof DOMParser === 'undefined') return [];
    try {
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${state.generatedSvgContent}</svg>`,
        'image/svg+xml'
      );
      if (doc.querySelector('parsererror')) return [];
      return Array.from(doc.querySelectorAll('text')).map((text, index) => {
        const firstTspan = text.querySelector('tspan');
        const fontFamily = text.getAttribute('font-family')
          || firstTspan?.getAttribute('font-family')
          || 'Lato';
        const fontSize = Number(text.getAttribute('font-size') || firstTspan?.getAttribute('font-size') || 12);
        const fontWeight = text.getAttribute('font-weight')
          || firstTspan?.getAttribute('font-weight')
          || '400';
        return {
          index,
          label: (text.textContent || `Line ${index + 1}`).replace(/\s+/g, ' ').trim() || `Line ${index + 1}`,
          text: text.textContent || '',
          fontFamily: AVAILABLE_FONTS.includes(fontFamily) ? fontFamily : 'Lato',
          fontSize: Number.isFinite(fontSize) ? fontSize : 12,
          fontWeight,
        };
      });
    } catch {
      return [];
    }
  }, [state.generatedSvgContent]);

  useEffect(() => {
    if (!state.generatedSvgContent) {
      setBaseGeneratedSvgContent(null);
      setInstantStyleVariant(1);
      instantStyleApplyingRef.current = false;
      return;
    }
    if (instantStyleApplyingRef.current) {
      instantStyleApplyingRef.current = false;
      return;
    }
    setBaseGeneratedSvgContent(state.generatedSvgContent);
    setInstantStyleVariant(1);
  }, [state.generatedSvgContent]);

  const clampDimension = (value: number) => Math.min(MAX_CUSTOM_DIMENSION_MM, Math.max(MIN_CUSTOM_DIMENSION_MM, Number.isFinite(value) ? value : MIN_CUSTOM_DIMENSION_MM));
  const isHeartPlaque = state.shape === Shape.Heart;
  const isBenchPlaque = isBenchPlaqueFormat(state.width, state.height, state.shape);
  const activeBenchSize = BENCH_SIZE_PRESETS.find((preset) => (
    state.shape === preset.shape && state.width === preset.width && state.height === preset.height
  ));
  const visibleBorderStyleOptions = useMemo(() => (
    isBenchPlaque
      ? BORDER_STYLE_OPTIONS.filter((option) => option.value !== BorderStyle.Scalloped && option.value !== BorderStyle.DoubleScalloped)
      : BORDER_STYLE_OPTIONS
  ), [isBenchPlaque]);
  const shapeLabel = state.shape === Shape.Circle ? 'Circle' : state.shape === Shape.Oval ? 'Oval' : 'Rectangle';
  const customFastTurnaround = fitsCustomFastTurnaround(state.width, state.height) && !state.wood;
  const customLongTurnaround = !customFastTurnaround;
  const customTurnaroundLabel = customFastTurnaround
    ? 'Custom size: 5 working days'
    : 'Custom size: 10 working days';

  useEffect(() => {
    setCustomWidthInput(String(state.width));
  }, [state.width]);

  useEffect(() => {
    setCustomHeightInput(String(state.height));
  }, [state.height]);

  useEffect(() => {
    if (activeStep !== 5) return;
    const frame = requestAnimationFrame(resizeInscriptionTextarea);
    return () => cancelAnimationFrame(frame);
  }, [activeStep, prompt]);

  useEffect(() => {
    if (
      state.borderStyle === BorderStyle.Inset
      || (isBenchPlaque && (state.borderStyle === BorderStyle.Scalloped || state.borderStyle === BorderStyle.DoubleScalloped))
    ) {
      onChange({ borderStyle: BorderStyle.Single });
    }
  }, [isBenchPlaque, onChange, state.borderStyle]);

  useEffect(() => {
    if (activeStep === 1 && sizeMode === 'standard' && activeBenchSize) {
      setBenchSizesExpanded(true);
    }
  }, [activeBenchSize, activeStep, sizeMode]);

  useEffect(() => {
    if (activeStep !== 1 || sizeMode !== 'standard') return;
    const selected = sizePresetStackRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!selected) return;
    window.setTimeout(() => {
      selected.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }, 80);
  }, [activeStep, sizeMode, state.height, state.shape, state.width]);

  useEffect(() => {
    if (activeStep !== 1 || sizeMode !== 'custom') {
      setTurnaroundToast(null);
      return;
    }
    if (activeStep !== 1 || sizeMode !== 'custom' || !customLongTurnaround) return;
    const message = '10 working days due to the custom size.';
    setTurnaroundToast(message);
    const timer = window.setTimeout(() => setTurnaroundToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [activeStep, customLongTurnaround, sizeMode]);

  const update = (key: keyof PlaqueState, value: any) => {
    if (activeStep === 1 && (key === 'width' || key === 'height' || key === 'shape')) {
      onSizeSelected();
    }
    if (key === 'width' || key === 'height') value = clampDimension(value);
    if (key === 'width' && state.shape === Shape.Circle) {
      onChange({
        width: value,
        height: value,
        ...(state.fixing === Fixing.Caps ? { capSize: getDefaultCapSize(value, value, state.shape) } : {}),
      });
      return;
    }
    if (key === 'shape' && value === Shape.Circle) {
      onChange({
        shape: value,
        height: state.width,
        cornerRadius: 0,
        ...(state.fixing === Fixing.Caps ? { capSize: getDefaultCapSize(state.width, state.width, value) } : {}),
      });
      return;
    }
    if (key === 'shape' && value === Shape.Heart) {
      onChange({
        shape: value,
        width: 180,
        height: 160,
        wood: false,
        fixing: Fixing.VHB,
        memorialImageEnabled: false,
      });
      return;
    }
    if (key === 'fixing' && value === Fixing.Caps) {
      onChange({
        fixing: value,
        ...(isBenchPlaque ? { fixingHoleCount: 2 } : {}),
        capSize: getDefaultCapSize(state.width, state.height, state.shape),
      });
      return;
    }
    if (key === 'fixing' && value === Fixing.Screws) {
      onChange({
        fixing: value,
        fixingHoleCount: state.fixing === Fixing.Screws ? state.fixingHoleCount : isBenchPlaque ? 2 : 4,
      });
      return;
    }
    if (key === 'fixing' && value !== Fixing.Screws) {
      onChange({
        fixing: value,
        ...((isBenchPlaque || value === Fixing.VHB) ? { fixingHoleCount: 2 } : {}),
      });
      return;
    }
    const nextWidth = key === 'width' ? value : state.width;
    const nextHeight = key === 'height' ? value : state.height;
    const nextShape = key === 'shape' ? value : state.shape;
    onChange({
      [key]: value,
      ...(key === 'shape' ? { cornerRadius: 0 } : {}),
      ...(state.fixing === Fixing.Caps && (key === 'width' || key === 'height' || key === 'shape')
        ? { capSize: getDefaultCapSize(nextWidth, nextHeight, nextShape) }
        : {}),
    });
  };

  const handleDimensionDraft = (key: 'width' | 'height', value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      if (key === 'width') setCustomWidthInput(value);
      if (key === 'height') setCustomHeightInput(value);
    }
  };

  const commitDimensionDraft = (key: 'width' | 'height') => {
    const draft = key === 'width' ? customWidthInput : customHeightInput;
    const committed = clampDimension(Number(draft));
    if (key === 'width') setCustomWidthInput(String(committed));
    if (key === 'height') setCustomHeightInput(String(committed));
    update(key, committed);
  };

  const commitDimensionOnEnter = (event: React.KeyboardEvent<HTMLInputElement>, key: 'width' | 'height') => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
      commitDimensionDraft(key);
    }
  };

  const applySizePreset = (preset: SizePreset) => {
    const presetIsBenchPlaque = isBenchPlaqueFormat(preset.width, preset.height, preset.shape);
    onSizeSelected();
    setTurnaroundToast(null);
    onChange({
      shape: preset.shape,
      width: preset.width,
      height: preset.height,
      cornerRadius: 0,
      ...(state.fixing === Fixing.Caps ? { capSize: getDefaultCapSize(preset.width, preset.height, preset.shape) } : {}),
      ...(presetIsBenchPlaque ? { border: false, wood: false, safeMargin: BENCH_SAFE_MARGIN_PERCENT, ...(state.fixing === Fixing.Caps ? { fixingHoleCount: 2 } : {}) } : {}),
      ...(preset.shape === Shape.Heart
        ? {
            wood: false,
            fixing: Fixing.VHB,
            memorialImageEnabled: false,
          }
        : {}),
    });
  };

  const applyGeneratedTextStyle = (style: Exclude<DesignStyle, DesignStyle.Auto> | null, variant: number) => {
    if (style === null) {
      if (baseGeneratedSvgContent) {
        instantStyleApplyingRef.current = true;
        onGeneratedSvgContentChange(baseGeneratedSvgContent);
      }
      setInstantStyleVariant(1);
      onChange({ designStyle: DesignStyle.Auto });
      return;
    }

    if (!state.generatedSvgContent || typeof DOMParser === 'undefined') {
      onChange({ designStyle: style });
      return;
    }

    try {
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${state.generatedSvgContent}</svg>`,
        'image/svg+xml'
      );
      if (doc.querySelector('parsererror')) return;
      const texts = Array.from(doc.querySelectorAll('text'));
      if (!texts.length) return;

      const palette = STYLE_FONT_PALETTES[style]?.[0] || STYLE_FONT_PALETTES[DesignStyle.ClassicalFormal][0];
      const spacing = instantStyleLetterSpacing[style] || instantStyleLetterSpacing[DesignStyle.ClassicalFormal]!;
      const sizes = texts.map((text) => Number(text.getAttribute('font-size') || text.querySelector('tspan')?.getAttribute('font-size') || 0));
      const maxSize = Math.max(...sizes.filter(Number.isFinite), 0);

      texts.forEach((text, index) => {
        const content = (text.textContent || '').trim();
        const size = Number(text.getAttribute('font-size') || text.querySelector('tspan')?.getAttribute('font-size') || 0);
        const isDate = /\b\d{3,4}\b/.test(content);
        const isTitle = size >= maxSize * 0.92 || (!index && !isDate);
        const fontFamily = isTitle ? palette.title : palette.body;
        const weight = isTitle
          ? style === DesignStyle.ModernMinimal ? "600" : "700"
          : isDate ? "500" : "400";
        const letterSpacing = isTitle ? spacing.title : isDate ? spacing.date : spacing.body;

        text.setAttribute('font-family', fontFamily);
        text.setAttribute('font-weight', weight);
        text.setAttribute('letter-spacing', letterSpacing);
        text.querySelectorAll('tspan').forEach((tspan) => {
          tspan.setAttribute('font-family', fontFamily);
          tspan.setAttribute('font-weight', weight);
          tspan.setAttribute('letter-spacing', letterSpacing);
        });
      });

      const nextSvg = Array.from(doc.documentElement.children)
        .map(node => new XMLSerializer().serializeToString(node).replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ''))
        .join('\n');
      instantStyleApplyingRef.current = true;
      onGeneratedSvgContentChange(nextSvg);
      setInstantStyleVariant(variant);
      onChange({ designStyle: style });
    } catch (error) {
      console.warn('Instant style change failed.', error);
    }
  };

  const formatPrice = (value: number) => {
    const hasPence = Math.round(value * 100) % 100 !== 0;
    return value.toLocaleString('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: hasPence ? 2 : 0,
      maximumFractionDigits: hasPence ? 2 : 0,
    });
  };
  const priceForPreset = (preset: SizePreset) => estimatePlaqueBasePrice({
    ...state,
    shape: preset.shape,
    width: preset.width,
    height: preset.height,
    cornerRadius: 0,
    wood: false,
  });
  const priceForMaterial = (material: Material) => estimatePlaqueBasePrice({
    ...state,
    material,
    wood: false,
  });
  const woodAddOnPrice = estimateWoodAddOn(state);

  const updateGeneratedTextLine = (lineIndex: number, changes: Partial<Pick<GeneratedTextControl, 'text' | 'fontFamily' | 'fontSize' | 'fontWeight'>>) => {
    if (!state.generatedSvgContent || typeof DOMParser === 'undefined') return;
    try {
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${state.generatedSvgContent}</svg>`,
        'image/svg+xml'
      );
      if (doc.querySelector('parsererror')) return;
      const text = Array.from(doc.querySelectorAll('text'))[lineIndex];
      if (!text) return;

      if (typeof changes.text === 'string') {
        const tspans = Array.from(text.querySelectorAll('tspan'));
        if (tspans.length) {
          tspans[0].textContent = changes.text;
          tspans.slice(1).forEach(tspan => tspan.remove());
        } else {
          text.textContent = changes.text;
        }
      }
      if (changes.fontFamily) {
        text.setAttribute('font-family', changes.fontFamily);
        text.querySelectorAll('tspan').forEach(tspan => tspan.setAttribute('font-family', changes.fontFamily!));
      }
      if (typeof changes.fontSize === 'number' && Number.isFinite(changes.fontSize)) {
        const nextSize = Math.min(120, Math.max(4, changes.fontSize));
        text.setAttribute('font-size', nextSize.toFixed(2));
        text.querySelectorAll('tspan').forEach(tspan => tspan.setAttribute('font-size', nextSize.toFixed(2)));
      }
      if (changes.fontWeight) {
        text.setAttribute('font-weight', changes.fontWeight);
        text.querySelectorAll('tspan').forEach(tspan => tspan.setAttribute('font-weight', changes.fontWeight!));
      }

      const nextSvg = Array.from(doc.documentElement.children)
        .map(node => new XMLSerializer().serializeToString(node).replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ''))
        .join('\n');
      onGeneratedSvgContentChange(nextSvg);
    } catch (error) {
      console.warn('Manual text edit failed.', error);
    }
  };

  const submitPrompt = () => {
    const copy = prompt.trim();
    if (!copy) return;
    onGenerate(copy);
  };

  const renderSizePresetButton = (preset: SizePreset, extraClassName = '') => {
    const active = state.shape === preset.shape && state.width === preset.width && state.height === preset.height;
    return (
      <button
        key={`${preset.label}-${preset.width}-${preset.height}`}
        onClick={() => applySizePreset(preset)}
        aria-pressed={active}
        className={`${choiceClass(active)} size-preset-option grid grid-cols-[64px_1fr_auto] items-center gap-3 ${extraClassName}`}
      >
        <span className="size-mini-stage flex h-12 w-16 items-center justify-center rounded-lg">
          <span
            className="size-mini-plate block border border-current/40 bg-current/10"
            style={{
              width: `${Math.max(24, Math.min(52, preset.width / 6))}px`,
              height: `${Math.max(10, Math.min(34, preset.height / 6))}px`,
            }}
          />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate">{preset.label}</span>
            {preset.badge && (
              <span className={`size-badge-chip ${preset.badge === 'Most popular' ? 'size-badge-chip--popular' : ''}`}>
                {preset.badge}
              </span>
            )}
          </span>
          <span className="mt-1 block text-[11px] font-bold opacity-70">{preset.note}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="size-dims rounded-full px-2 py-1 text-[10px] font-black">{preset.width} x {preset.height}</span>
          <span className="size-price-chip rounded-full px-2 py-1 text-[10px] font-black">
            from {formatPrice(priceForPreset(preset))}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="controls-instrument rounded-lg p-4 text-[#1b231f] md:p-5">
      {turnaroundToast && (
        <div className="turnaround-toast" role="status" aria-live="polite">
          <strong>Custom turnaround</strong>
          <span>{turnaroundToast}</span>
        </div>
      )}
      <StepIntro step={activeStep} />

      {activeStep === 1 && (
        <section className="space-y-4">
          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#efe4d1] p-1">
              <button
                type="button"
                onClick={() => {
                  setSizeMode('standard');
                  setTurnaroundToast(null);
                }}
                aria-pressed={sizeMode === 'standard'}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-black transition ${
                  sizeMode === 'standard' ? 'bg-[#f2d688] text-[#1b231f] shadow-sm' : 'text-[#2f3832] hover:bg-[#efe4d1]'
                }`}
              >
                Standard sizes
              </button>
              <button
                type="button"
                onClick={() => {
                  setSizeMode('custom');
                  onSizeSelected();
                }}
                aria-pressed={sizeMode === 'custom'}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-black transition ${
                  sizeMode === 'custom' ? 'bg-[#f2d688] text-[#1b231f] shadow-sm' : 'text-[#2f3832] hover:bg-[#efe4d1]'
                }`}
              >
                Custom size
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-[#d7b66a]/25 bg-[#1b231f] px-3 py-2 text-xs font-black text-[#f2d688]">
              {sizeMode === 'standard'
                ? 'Standard sizes: 5 working days'
                : customTurnaroundLabel}
            </div>

            {sizeMode === 'standard' && (
              <div className="flex items-start justify-between gap-3">
                <div className="mt-4">
                  <div className="text-sm font-black">Standard size presets</div>
                  <div className="text-xs leading-5 text-[#6a746d]">
                    Choose a common production size. Prices update from your selected material.
                  </div>
                </div>
              </div>
            )}

            {sizeMode === 'standard' ? (
              <div className="size-preset-stack mt-3 grid gap-2" ref={sizePresetStackRef}>
                {SIZE_PRESETS.map((preset) => renderSizePresetButton(preset))}

                <div className={`bench-size-group ${activeBenchSize ? 'is-active' : ''}`}>
                  <button
                    type="button"
                    className="bench-size-header studio-press"
                    onClick={() => setBenchSizesExpanded((open) => !open)}
                    aria-expanded={benchSizesExpanded}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span>Bench plaques</span>
                        <span className="bench-class-chip">Bench format</span>
                      </span>
                      <span className="mt-1 block text-[11px] font-bold opacity-70">
                        {activeBenchSize
                          ? `${activeBenchSize.label} selected · all options in this group are bench plaques`
                          : 'Long, low bench and seat plaque sizes'}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="size-price-chip rounded-full px-2 py-1 text-[10px] font-black">
                        from {formatPrice(priceForPreset(BENCH_SIZE_PRESETS[0]))}
                      </span>
                      <span className="bench-size-chevron" aria-hidden="true">{benchSizesExpanded ? '-' : '+'}</span>
                    </span>
                  </button>

                  {benchSizesExpanded && (
                    <div className="bench-size-options">
                      {BENCH_SIZE_PRESETS.map((preset) => renderSizePresetButton(preset, 'bench-size-option'))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 border-t border-[rgba(84, 72, 52, 0.14)] pt-4">
                <div>
                  <div className="text-sm font-black">Custom size and shape</div>
                  <div className="mt-1 text-xs leading-5 text-[#6a746d]">{shapeLabel} · {state.width} x {state.height}mm</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    [Shape.Rect, 'Rectangle'],
                    [Shape.Oval, 'Oval'],
                    [Shape.Circle, 'Circle'],
                  ].map(([shape, label]) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => update('shape', shape)}
                      aria-pressed={state.shape === shape}
                      className={pillClass(state.shape === shape)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-[#6a746d]">
                      <span>{state.shape === Shape.Circle ? 'Diameter mm' : 'Width mm'}</span>
                      <span className="text-[#1b231f]">{state.width}</span>
                    </div>
                    <input
                      type="range"
                      min={MIN_CUSTOM_DIMENSION_MM}
                      max={MAX_CUSTOM_DIMENSION_MM}
                      step="1"
                      value={state.width}
                      onChange={(e) => {
                        setCustomWidthInput(e.target.value);
                        update('width', Number(e.target.value));
                      }}
                      className="w-full accent-[#b98235]"
                    />
                    <input
                      type="number"
                      min={MIN_CUSTOM_DIMENSION_MM}
                      max={MAX_CUSTOM_DIMENSION_MM}
                      step="1"
                      value={customWidthInput}
                      inputMode="numeric"
                      onChange={(e) => handleDimensionDraft('width', e.target.value)}
                      onBlur={() => commitDimensionDraft('width')}
                      onKeyDown={(e) => commitDimensionOnEnter(e, 'width')}
                      className={`${fieldClass} mt-2`}
                    />
                  </label>

                  {state.shape !== Shape.Circle && (
                    <label className="block">
                      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-[#6a746d]">
                        <span>Height mm</span>
                        <span className="text-[#1b231f]">{state.height}</span>
                      </div>
                      <input
                        type="range"
                        min={MIN_CUSTOM_DIMENSION_MM}
                        max={MAX_CUSTOM_DIMENSION_MM}
                        step="1"
                        value={state.height}
                        onChange={(e) => {
                          setCustomHeightInput(e.target.value);
                          update('height', Number(e.target.value));
                        }}
                        className="w-full accent-[#b98235]"
                      />
                      <input
                        type="number"
                        min={MIN_CUSTOM_DIMENSION_MM}
                        max={MAX_CUSTOM_DIMENSION_MM}
                        step="1"
                        value={customHeightInput}
                        inputMode="numeric"
                        onChange={(e) => handleDimensionDraft('height', e.target.value)}
                        onBlur={() => commitDimensionDraft('height')}
                        onKeyDown={(e) => commitDimensionOnEnter(e, 'height')}
                        className={`${fieldClass} mt-2`}
                      />
                    </label>
                  )}
                </div>

              </div>
            )}
          </div>
        </section>
      )}

      {activeStep === 0 && (
        <section className="space-y-4">
          <div className="grid gap-2">
            {MATERIAL_ORDER.map((material) => (
              <React.Fragment key={material}>
                <button
                  onClick={() => update('material', material)}
                  aria-pressed={state.material === material}
                  className={`material-option flex min-h-[64px] items-center gap-3 rounded-lg border p-3 text-left transition active:scale-[0.99] ${
                    state.material === material ? 'border-[#c6932e] bg-[#f2d688] text-[#1b231f]' : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#1b231f]'
                  }`}
                >
                  <span className="h-10 w-10 shrink-0 rounded-lg border border-black/10" style={{ background: MATERIAL_SWATCH[material] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">{MATERIAL_LABELS[material]}</span>
                    <span className="block text-xs leading-4 opacity-70">{MATERIAL_NOTES[material]}</span>
                  </span>
                  {showMaterialPrices && (
                    <span className="material-price-chip shrink-0 rounded-full px-2 py-1 text-xs font-black">
                      {formatPrice(priceForMaterial(material))}
                    </span>
                  )}
                </button>
                {material === Material.AgedBrass && state.material === Material.AgedBrass && (
                  <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] p-3">
                    <div className="mb-2 text-sm font-black">Aged brass finish</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Light aged', 0.18],
                        ['Middle aged', 0.48],
                        ['Heavy aged', 0.82],
                      ].map(([label, value]) => (
                        <button
                          key={label}
                          onClick={() => update('ageIntensity', value)}
                          className={pillClass(Math.abs(state.ageIntensity - Number(value)) < 0.08)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {activeStep === 2 && (
        <section className="space-y-4">
          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="text-sm font-black">Engraving colour</div>
            <div className="mt-1 text-xs leading-5 text-[#6a746d]">
              This controls the visible inscription colour in the proof and final SVG.
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                [TextColor.Black, '#1a1a1a', 'Black'],
                [TextColor.Grey, '#666666', 'Grey'],
                [TextColor.White, '#ffffff', 'White'],
                [TextColor.Cream, '#f5e6c8', 'Cream'],
              ].map(([color, swatch, label]) => (
                <button key={color} onClick={() => update('textColor', color)} className={pillClass(state.textColor === color)}>
                  <span className="mx-auto mb-1 block h-4 w-4 rounded-full border border-black/20" style={{ backgroundColor: swatch }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeStep === 3 && (
        <section className="space-y-4">
          {isHeartPlaque && (
            <div className="rounded-lg border border-[rgba(88,199,176,0.26)] bg-[#151f1b] p-4 text-sm font-bold leading-6 text-[#1f755f]">
              Heart plaques are supplied without visible fixings. Hidden adhesive is locked for this shape.
            </div>
          )}
          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#efe4d1] p-1">
              <button
                type="button"
                onClick={() => setFixingsBorderMode('fixings')}
                aria-pressed={fixingsBorderMode === 'fixings'}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-black transition ${
                  fixingsBorderMode === 'fixings' ? 'bg-[#f2d688] text-[#1b231f] shadow-sm' : 'text-[#2f3832] hover:bg-[#efe4d1]'
                }`}
              >
                Fixings
              </button>
              <button
                type="button"
                onClick={() => setFixingsBorderMode('border')}
                aria-pressed={fixingsBorderMode === 'border'}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-black transition ${
                  fixingsBorderMode === 'border' ? 'bg-[#f2d688] text-[#1b231f] shadow-sm' : 'text-[#2f3832] hover:bg-[#efe4d1]'
                }`}
              >
                Border
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm font-black">{fixingsBorderMode === 'fixings' ? 'Fixings' : 'Border'}</div>
              <div className="mt-1 text-xs leading-5 text-[#6a746d]">
                {fixingsBorderMode === 'fixings'
                  ? 'Choose visible hardware or a clean hidden mount.'
                  : isBenchPlaque
                    ? 'Choose a simple bench-plaque border style.'
                    : 'Choose whether to add a border and which style to use.'}
              </div>
            </div>

            {fixingsBorderMode === 'fixings' ? (
              <div className="mt-3 grid gap-2">
                {[
                  [Fixing.Caps, 'Decorative caps', 'Thin flat metal caps for a traditional finished plaque'],
                  [Fixing.Screws, 'Countersunk screws', 'Flush screws colour-matched to the selected plaque material'],
                  [Fixing.VHB, 'Hidden adhesive', 'Clean face with no visible holes or mounting hardware'],
                  [Fixing.None, 'No fixings', 'Your plaque will be supplied without any holes or fixings'],
                ].map(([fixing, label, note]) => (
                  <React.Fragment key={fixing}>
                    <button
                      onClick={() => !isHeartPlaque && update('fixing', fixing)}
                      aria-pressed={state.fixing === fixing}
                      disabled={isHeartPlaque && fixing !== Fixing.VHB}
                      className={`${choiceClass(state.fixing === fixing)} min-h-[64px] disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="block text-sm font-black">{label}</span>
                        {fixing === Fixing.Screws && state.fixing === Fixing.Screws && (
                          <span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-black">
                            {state.fixingHoleCount} holes
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs leading-4 opacity-70">{note}</span>
                    </button>
                    {fixing === Fixing.Screws && state.fixing === Fixing.Screws && !isHeartPlaque && (
                      <div className="rounded-lg border border-[#c6932e]/35 bg-[#f6efe2] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-sm font-black">Countersunk screw holes</div>
                          <div className="rounded-full bg-[#fffaf0] px-2 py-1 text-[10px] font-black text-[#6a746d]">
                            {isBenchPlaque ? 'Bench plaque' : 'Visible screws'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[2, 4].map((count) => (
                            <button
                              key={count}
                              onClick={() => update('fixingHoleCount', count)}
                              className={pillClass(state.fixingHoleCount === count)}
                            >
                              {count} holes
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs font-bold leading-5 text-[#6a746d]">
                          Choose two end holes or four corner holes for countersunk screw fixing.
                        </div>
                      </div>
                    )}
                    {fixing === Fixing.Caps && state.fixing === Fixing.Caps && (
                      <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] p-3">
                        <div className="mb-2 text-sm font-black">Cap diameter</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[10, 15].map((size) => (
                            <button key={size} onClick={() => update('capSize', size)} className={pillClass(state.capSize === size)}>
                              {size}mm caps
                            </button>
                          ))}
                        </div>
                        {isBenchPlaque && (
                          <div className="mt-3 rounded-lg border border-[rgba(84,72,52,0.14)] bg-[#fffaf0] px-3 py-2 text-xs font-bold leading-5 text-[#6a746d]">
                            Decorative caps on bench plaques use two visible caps.
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update('border', false)}
                    aria-pressed={!state.border}
                    className={choiceClass(!state.border)}
                  >
                    <span className="block">Border off</span>
                    <span className="mt-1 block text-[11px] font-bold opacity-70">Clean plaque face</span>
                  </button>
                  {visibleBorderStyleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ border: true, borderStyle: option.value })}
                      aria-pressed={state.border && state.borderStyle === option.value}
                      className={choiceClass(state.border && state.borderStyle === option.value)}
                    >
                      <span className="block">{option.label}</span>
                      <span className="mt-1 block text-[11px] font-bold opacity-70">{option.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {false && activeStep === 99 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div>
              <div className="text-sm font-black">Optional artwork</div>
              <div className="text-xs text-[#6a746d]">Most plaques should stay text-only. Add image artwork only when needed.</div>
            </div>
            <button onClick={() => onChange({ memorialImageEnabled: !state.memorialImageEnabled })} aria-pressed={state.memorialImageEnabled} className={pillClass(state.memorialImageEnabled)}>
              {state.memorialImageEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {state.memorialImageEnabled && <>
          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#6a746d]">Artwork method</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                [MemorialImageMethod.Engraved, 'Engraved artwork', 'Black engraved artwork'],
                [MemorialImageMethod.UvPrinted, 'UV printed', 'Full colour print direct to metal'],
              ].map(([method, label, note]) => (
                <button
                  key={method}
                  onClick={() => onChange({ memorialImageMethod: method as MemorialImageMethod })}
                  disabled={isGeneratingMemorialImage || !state.memorialImageEnabled}
                  className={`min-h-[74px] rounded-lg border p-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${
                    state.memorialImageMethod === method ? 'border-[#c6932e] bg-[#f2d688] text-[#1b231f]' : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#2f3832]'
                  }`}
                >
                  <span className="block text-sm font-black">{label}</span>
                  <span className="mt-1 block text-[11px] font-bold leading-4 opacity-70">{note}</span>
                </button>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,.avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onMemorialImageUpload(file);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isGeneratingMemorialImage || !state.memorialImageEnabled}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#c6932e]/45 bg-[#fffaf0] p-3 text-left transition disabled:opacity-50"
          >
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#efe4d1]">
              {portraitPreviewUrl ? (
                <img src={portraitPreviewUrl} alt="Uploaded artwork" className="h-full w-full object-contain" />
              ) : (
                <span className="text-3xl font-light text-[#7d9188]">+</span>
              )}
            </span>
            <span>
              <span className="block text-base font-black">{portraitPreviewUrl ? 'Replace artwork' : 'Upload artwork'}</span>
              <span className="mt-1 block text-xs leading-5 text-[#6a746d]">PNG, JPEG, WebP, or AVIF source image.</span>
            </span>
          </button>

          <input
            ref={styleInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,.avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onStyleReferenceUpload(file);
            }}
          />

          {state.memorialImageMethod === MemorialImageMethod.Engraved && (
            <details open className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
              <summary className="cursor-pointer text-sm font-black text-[#1b231f]">EtchMaster image settings</summary>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#6a746d]">Input mode</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      [EtchmasterImageMode.Prompt, 'Prompt'],
                      [EtchmasterImageMode.Image, 'Image'],
                      [EtchmasterImageMode.SubjectStyle, 'Subject + style'],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => onChange({ etchmasterMode: mode as EtchmasterImageMode })}
                        className={pillClass(state.etchmasterMode === mode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {state.etchmasterMode === EtchmasterImageMode.SubjectStyle && (
                  <button
                    onClick={() => styleInputRef.current?.click()}
                    disabled={isGeneratingMemorialImage}
                    className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#c6932e]/45 bg-[#f6efe2] p-3 text-left transition disabled:opacity-50"
                  >
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#efe4d1]">
                      {state.etchmasterStyleReferenceUrl ? (
                        <img src={state.etchmasterStyleReferenceUrl} alt="EtchMaster style reference" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-2xl font-light text-[#7d9188]">+</span>
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-black">{state.etchmasterStyleReferenceUrl ? 'Replace style reference' : 'Upload style reference'}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#6a746d]">Second image used for style only.</span>
                    </span>
                  </button>
                )}

                <label className="block text-xs font-black uppercase tracking-wide text-[#6a746d]">
                  Prompt
                  <textarea
                    value={state.etchmasterPrompt}
                    onChange={(event) => onChange({ etchmasterPrompt: event.target.value })}
                    placeholder="Optional art direction, e.g. more stippled shading, stronger banknote hatching, cleaner white background..."
                    className={`${fieldClass} mt-1 min-h-[96px] resize-none normal-case tracking-normal`}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-black uppercase tracking-wide text-[#6a746d]">
                    Model
                    <select
                      value={state.etchmasterModel}
                      onChange={(event) => {
                        const model = event.target.value as EtchmasterImageModel;
                        onChange({
                          etchmasterModel: model,
                          ...(model === EtchmasterImageModel.NanoBanana1 && ['4:1', '1:4', '8:1', '1:8'].includes(state.etchmasterAspectRatio)
                            ? { etchmasterAspectRatio: '1:1' }
                            : {}),
                        });
                      }}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value={EtchmasterImageModel.NanoBanana2}>Nano Banana 2</option>
                      <option value={EtchmasterImageModel.NanoBanana1}>Nano Banana 1</option>
                    </select>
                  </label>

                  <label className="text-xs font-black uppercase tracking-wide text-[#6a746d]">
                    Image size
                    <select
                      value={state.etchmasterImageSize}
                      disabled={state.etchmasterModel !== EtchmasterImageModel.NanoBanana2}
                      onChange={(event) => onChange({ etchmasterImageSize: event.target.value })}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value="512px">512px</option>
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-black uppercase tracking-wide text-[#6a746d]">
                    Aspect ratio
                    <select
                      value={state.etchmasterAspectRatio}
                      onChange={(event) => onChange({ etchmasterAspectRatio: event.target.value })}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value="auto">Auto from plaque box</option>
                      <option value="1:1">1:1</option>
                      <option value="4:3">4:3</option>
                      <option value="3:4">3:4</option>
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      {state.etchmasterModel === EtchmasterImageModel.NanoBanana2 && (
                        <>
                          <option value="4:1">4:1</option>
                          <option value="1:4">1:4</option>
                          <option value="8:1">8:1</option>
                          <option value="1:8">1:8</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label className="text-xs font-black uppercase tracking-wide text-[#6a746d]">
                    Style preset
                    <select
                      value={state.etchmasterPreset}
                      onChange={(event) => onChange({ etchmasterPreset: event.target.value as EtchmasterImagePreset })}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value={EtchmasterImagePreset.None}>None</option>
                      <option value={EtchmasterImagePreset.Etching}>Etching</option>
                      <option value={EtchmasterImagePreset.Engraving}>Engraving</option>
                      <option value={EtchmasterImagePreset.LineArt}>Line art</option>
                      <option value={EtchmasterImagePreset.Manga}>Manga</option>
                      <option value={EtchmasterImagePreset.ScratchBoard}>Scratchboard</option>
                      <option value={EtchmasterImagePreset.Woodcut}>Woodcut</option>
                      <option value={EtchmasterImagePreset.Stippling}>Stippling</option>
                      <option value={EtchmasterImagePreset.Halftone}>Halftone</option>
                      <option value={EtchmasterImagePreset.Hatching}>Hatching</option>
                      <option value={EtchmasterImagePreset.Linocut}>Linocut</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-black uppercase tracking-wide text-[#6a746d]">
                    EtchMaster shape
                    <select
                      value={state.etchmasterShapeMask}
                      onChange={(event) => onChange({ etchmasterShapeMask: event.target.value as EtchmasterShapeMask })}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value={EtchmasterShapeMask.None}>None</option>
                      <option value={EtchmasterShapeMask.Circle}>Circle</option>
                      <option value={EtchmasterShapeMask.Oval}>Oval</option>
                      <option value={EtchmasterShapeMask.Shield}>Shield</option>
                      <option value={EtchmasterShapeMask.Heart}>Heart</option>
                    </select>
                  </label>

                  <label className="text-xs font-black uppercase tracking-wide text-[#6a746d]">
                    Vignette edge
                    <select
                      value={state.etchmasterShapeEdge}
                      disabled={state.etchmasterShapeMask === EtchmasterShapeMask.None}
                      onChange={(event) => onChange({ etchmasterShapeEdge: event.target.value as EtchmasterShapeEdge })}
                      className={`${fieldClass} mt-1`}
                    >
                      <option value={EtchmasterShapeEdge.Solid}>Solid</option>
                      <option value={EtchmasterShapeEdge.Outline}>Outline</option>
                      <option value={EtchmasterShapeEdge.Vignette}>Vignette</option>
                    </select>
                  </label>
                </div>
                {state.etchmasterShapeMask === EtchmasterShapeMask.Heart && (
                  <p className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] px-3 py-2 text-xs leading-5 text-[#6a746d]">
                    Heart vignettes keep or add etched background shading inside the heart, so the shape stays readable and the subject is not cut by the lobes or point.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onChange({ etchmasterEnhancePrompt: !state.etchmasterEnhancePrompt })}
                    className={pillClass(state.etchmasterEnhancePrompt)}
                  >
                    Prompt enhance {state.etchmasterEnhancePrompt ? 'on' : 'off'}
                  </button>
                  <button
                    onClick={() => onChange({ etchmasterRemoveBackground: !state.etchmasterRemoveBackground })}
                    className={pillClass(state.etchmasterRemoveBackground)}
                  >
                    Remove background {state.etchmasterRemoveBackground ? 'on' : 'off'}
                  </button>
                </div>

                <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black">Vector threshold</div>
                      <div className="text-xs text-[#6a746d]">Lower keeps more faint marks; higher gives cleaner sparse paths.</div>
                    </div>
                    <div className="text-sm font-black text-[#9a6a16]">{state.etchmasterVectorThreshold}</div>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="220"
                    value={state.etchmasterVectorThreshold}
                    onChange={(event) => onChange({ etchmasterVectorThreshold: Number(event.target.value) })}
                    className="mt-4 w-full accent-[#b98235]"
                  />
                </div>
              </div>
            </details>
          )}

          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#6a746d]">Production layout</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                [MemorialImagePlacement.AboveText, 'Artwork above', 'Text below'],
                [MemorialImagePlacement.PortraitLeft, 'Artwork left', 'Text right'],
                [MemorialImagePlacement.PortraitRight, 'Text left', 'Artwork right'],
                [MemorialImagePlacement.PortraitFocus, 'Artwork focus', 'Short wording below'],
              ].map(([layout, label, note]) => (
                <button
                  key={layout}
                  onClick={() => onChange({ memorialImagePlacement: layout as MemorialImagePlacement })}
                  disabled={isGeneratingMemorialImage || !state.memorialImageEnabled}
                  className={`rounded-lg border p-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${
                    state.memorialImagePlacement === layout ? 'border-[#c6932e] bg-[#f2d688] text-[#1b231f]' : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#2f3832]'
                  }`}
                >
                  <span className="mb-3 block h-12 rounded-lg border border-current/20 p-1.5 opacity-80">
                    <LayoutThumbnail layout={layout as MemorialImagePlacement} />
                  </span>
                  <span className="block text-sm font-black">{label}</span>
                  <span className="mt-1 block text-[11px] font-bold opacity-70">{note}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#6a746d]">
              Wide plaques use a wide vignette so useful room, chair, and landscape context can stay in the engraving.
            </p>
          </div>

          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#6a746d]">Proof clip only</div>
            <p className="mb-2 text-xs leading-5 text-[#6a746d]">
              EtchMaster shape controls the generated vignette. This only clips/places the finished artwork on the proof.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                [MemorialImageShape.Rectangle, 'Rectangle'],
                [MemorialImageShape.Circle, 'Circle'],
                [MemorialImageShape.Heart, 'Heart'],
              ].map(([shape, label]) => (
                <button
                  key={shape}
                  onClick={() => onChange({ memorialImageShape: shape as MemorialImageShape })}
                  disabled={isGeneratingMemorialImage || !state.memorialImageEnabled}
                  className={pillClass(state.memorialImageShape === shape)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black">Artwork size</div>
                <div className="text-xs text-[#6a746d]">Changes how much plaque space the vignette gets.</div>
              </div>
              <div className="text-sm font-black text-[#9a6a16]">{Math.round(state.memorialImageScale * 100)}%</div>
            </div>
            <input
              type="range"
              min="25"
              max="500"
              value={Math.round(state.memorialImageScale * 100)}
              disabled={isGeneratingMemorialImage || !state.memorialImageEnabled}
              onChange={(event) => onChange({ memorialImageScale: Number(event.target.value) / 100 })}
              className="mt-4 w-full accent-[#b98235] disabled:opacity-50"
            />
          </div>

          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black">Photo fit</div>
                <div className="text-xs text-[#6a746d]">Zooms the image inside the artwork area after generation.</div>
              </div>
              <div className="text-sm font-black text-[#9a6a16]">{Math.round(state.memorialImageZoom * 100)}%</div>
            </div>
            <input
              type="range"
              min="25"
              max="500"
              value={Math.round(state.memorialImageZoom * 100)}
              disabled={isGeneratingMemorialImage || !state.memorialImageEnabled}
              onChange={(event) => onChange({ memorialImageZoom: Number(event.target.value) / 100 })}
              className="mt-4 w-full accent-[#b98235] disabled:opacity-50"
            />
          </div>

          <div className={state.memorialImageMethod === MemorialImageMethod.Engraved ? 'grid grid-cols-[1fr_auto] gap-2' : 'grid gap-2'}>
            {state.memorialImageMethod === MemorialImageMethod.Engraved ? (
              <button
                onClick={onGenerateMemorialImage}
                disabled={
                  isGeneratingMemorialImage ||
                  !state.memorialImageEnabled ||
                  (state.etchmasterMode !== EtchmasterImageMode.Prompt && !portraitPreviewUrl) ||
                  (state.etchmasterMode === EtchmasterImageMode.SubjectStyle && !state.etchmasterStyleReferenceUrl)
                }
                className="min-h-[52px] rounded-lg bg-[#f2d688] px-4 py-3 text-sm font-black text-[#1b231f] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingMemorialImage ? 'Generating engraving...' : 'Generate engraving'}
              </button>
            ) : (
              <div className="rounded-lg border border-[rgba(88,199,176,0.26)] bg-[#151f1b] p-3 text-xs font-bold leading-5 text-[#1f755f]">
                UV print uses the uploaded colour image directly. Use artwork size for plaque space and photo fit only if you want the image tighter. No engraving generation is needed.
              </div>
            )}
            {(portraitPreviewUrl || state.memorialImageSvg) && (
              <button onClick={onClearMemorialImage} disabled={isGeneratingMemorialImage} className={pillClass(false)}>
                Clear
              </button>
            )}
          </div>

          {memorialStatus && <div className="rounded-lg border border-[#d9c289] bg-[#221d12] p-3 text-xs leading-5 text-[#e8c875]">{memorialStatus}</div>}
          </>}
        </section>
      )}

      {activeStep === 4 && (
        <section className="space-y-4">
          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black">Wood backing</div>
                <div className="text-xs text-[#6a746d]">
                  {isHeartPlaque
                    ? 'Not available on heart plaques.'
                    : isBenchPlaque
                      ? 'Not available on bench plaques.'
                      : `Adds ${formatPrice(woodAddOnPrice)} for a 15mm timber backing board.`}
                </div>
              </div>
              <button
                onClick={() => !isHeartPlaque && !isBenchPlaque && update('wood', !state.wood)}
                disabled={isHeartPlaque || isBenchPlaque}
                className={`${pillClass(state.wood)} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isHeartPlaque || isBenchPlaque ? 'Not available' : state.wood ? `Added ${formatPrice(woodAddOnPrice)}` : `Add ${formatPrice(woodAddOnPrice)}`}
              </button>
            </div>
            {state.wood && !isHeartPlaque && !isBenchPlaque && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => update('woodTone', 'light')} className={pillClass(state.woodTone === 'light')}>Light</button>
                <button onClick={() => update('woodTone', 'dark')} className={pillClass(state.woodTone === 'dark')}>Dark</button>
              </div>
            )}
          </div>
        </section>
      )}

      {activeStep === 5 && (
        <section className="space-y-4">
          <div className="ai-typesetter-panel rounded-lg border border-[#d7b66a]/35 bg-[#151f1b] p-4">
            <div className="flex items-start gap-3">
              <div className={`ai-typesetter-orb ${isGenerating ? 'is-working' : ''}`} aria-hidden="true">
                <span />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f2d688]">
                  Intelligent typesetter
                </p>
                <h3 className="mt-1 text-lg font-black leading-tight text-[#edf3ef]">
                  Enter your text below and our typesetter will lay it out.
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#aab8b0]">
                  It corrects spelling and grammar, chooses the line breaks, hierarchy, spacing, and font balance for the plaque size you have selected.
                </p>
              </div>
            </div>
            {isGenerating && (
              <div className="mt-4 rounded-lg border border-[#f2d688]/25 bg-[#f2d688]/10 p-3" role="status" aria-live="polite">
                <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#f7d98b]">
                  <span>
                    {generationPhase === 'concept'
                      ? 'Reading the wording'
                      : generationPhase === 'transcribe'
                        ? 'Setting the plaque type'
                        : 'Layout in progress'}
                  </span>
                  <span className="ai-typesetter-dots" aria-hidden="true"><i /><i /><i /></span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf3ef]/10">
                  <div className="ai-typesetter-progress h-full rounded-full bg-[#f2d688]" />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div>
              <label htmlFor="inscription-wording-input" className="block text-xs font-black uppercase tracking-wide text-[#6a746d]">
                Enter your text
              </label>
              <textarea
                ref={inscriptionTextareaRef}
                id="inscription-wording-input"
                value={prompt}
                onChange={(e) => {
                  onPromptChange(e.target.value);
                  requestAnimationFrame(resizeInscriptionTextarea);
                }}
                placeholder="Type the words you want on the plaque..."
                className={`${fieldClass} mt-1 min-h-[240px] max-h-[360px] resize-none overflow-hidden normal-case leading-6 tracking-normal`}
              />
            </div>
          </div>

          {!isIterating && (
          <div className="grid gap-2">
            <button
              onClick={() => {
                setManualTextOpen(false);
                submitPrompt();
              }}
              disabled={isGenerating || !prompt.trim()}
              className="min-h-[52px] rounded-lg bg-[#f2d688] px-4 py-3 text-sm font-black text-[#1b231f] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? generationPhase === 'concept'
                  ? 'Preparing wording...'
                  : generationPhase === 'transcribe'
                    ? 'Fitting your layout...'
                    : 'Working...'
                : isIterating
                  ? 'Regenerate'
                  : 'Generate layout'}
            </button>
          </div>
          )}

          {isIterating && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[#edf3ef]/14 bg-[#edf3ef]/6 p-3">
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#f2d688]">Choose a look</div>
                <div className="grid grid-cols-5 gap-2" aria-label="Restyle the current layout">
                  {INSTANT_STYLE_OPTIONS.map((option) => {
                    const active = instantStyleVariant === option.variant;
                    return (
                      <button
                        key={option.variant}
                        type="button"
                        onClick={() => applyGeneratedTextStyle(option.style, option.variant)}
                        aria-pressed={active}
                        className={`relative aspect-square min-h-[40px] rounded-lg border text-base font-black transition ${
                          active
                            ? 'border-[#f2d688] bg-[#f2d688] text-[#13201c] shadow-[0_0_0_3px_rgba(242,214,136,0.25),0_12px_28px_rgba(242,214,136,0.18)] ring-2 ring-[#f2d688]/55'
                            : 'border-[#edf3ef]/18 bg-[#edf3ef]/8 text-[#edf3ef] hover:border-[#f2d688]/55'
                        }`}
                        title={option.title}
                      >
                        {option.label}
                        {active && (
                          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#13201c]" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualTextOpen(false);
                    submitPrompt();
                  }}
                  disabled={isGenerating || !prompt.trim()}
                  className="min-h-[48px] rounded-lg border border-[#f2d688]/55 bg-[#f2d688] px-4 py-3 text-sm font-black text-[#13201c] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setManualTextOpen((open) => !open)}
                  className={`min-h-[48px] rounded-lg border px-4 py-3 text-sm font-black transition ${
                    manualTextOpen
                      ? 'border-[#f2d688]/65 bg-[#f2d688]/18 text-[#f7d98b]'
                      : 'border-[#edf3ef]/18 bg-[#edf3ef]/8 text-[#edf3ef]'
                  }`}
                  aria-expanded={manualTextOpen}
                >
                  {manualTextOpen ? 'Hide manual tweaks' : 'Tweak manually'}
                </button>
              </div>

              {manualTextOpen && (
                <div className="manual-line-panel rounded-lg border border-[#f2d688]/35 bg-[#111b1a] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-[#f2d688]">Line by line controls</div>
                    <p className="mt-1 text-xs leading-5 text-[#aab8b0]">Edit the generated text blocks directly without redrawing the layout.</p>
                  </div>
                  <span className="rounded-full border border-[#edf3ef]/14 bg-[#edf3ef]/8 px-2 py-1 text-[10px] font-black text-[#edf3ef]">
                    {generatedTextControls.length} lines
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {generatedTextControls.length ? generatedTextControls.map((line) => (
                    <div key={line.index} className="rounded-lg border border-[#edf3ef]/14 bg-[#edf3ef]/6 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-black text-[#edf3ef]" htmlFor={`generated-text-line-${line.index}`}>
                          Line {line.index + 1}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateGeneratedTextLine(line.index, { fontWeight: line.fontWeight === '700' || line.fontWeight === 'bold' ? '400' : '700' })}
                            aria-pressed={line.fontWeight === '700' || line.fontWeight === 'bold'}
                            aria-label={`Toggle bold for ${line.label}`}
                            className={`h-[38px] w-[38px] rounded-lg border text-sm font-black transition ${
                              line.fontWeight === '700' || line.fontWeight === 'bold'
                                ? 'border-[#c6932e] bg-[#f2d688] text-[#1b231f]'
                                : 'border-[#edf3ef]/18 bg-[#edf3ef]/8 text-[#edf3ef] hover:border-[#c6932e]'
                            }`}
                            title="Toggle bold"
                          >
                            B
                          </button>
                          <label className="flex min-w-[118px] items-center gap-2 text-xs font-black text-[#aab8b0]">
                            <span>Size</span>
                            <input
                              type="number"
                              min="4"
                              max="120"
                              step="0.5"
                              value={line.fontSize}
                              onChange={(event) => updateGeneratedTextLine(line.index, { fontSize: Number(event.target.value) })}
                              className="h-[38px] w-[74px] rounded-lg border border-[#edf3ef]/18 bg-[#0f1817] px-2 text-sm font-black text-[#edf3ef] outline-none transition focus:border-[#c6932e] focus:ring-4 focus:ring-[#b98235]/20"
                              aria-label={`Font size for ${line.label}`}
                            />
                          </label>
                        </div>
                      </div>
                      <textarea
                        id={`generated-text-line-${line.index}`}
                        value={line.text}
                        onChange={(event) => updateGeneratedTextLine(line.index, { text: event.target.value })}
                        className={`${fieldClass} mt-2 min-h-[72px] resize-y px-3 py-2 text-sm leading-5`}
                        aria-label={`Text for line ${line.index + 1}`}
                      />
                      <div className="mt-2">
                        <select
                          value={line.fontFamily}
                          onChange={(event) => updateGeneratedTextLine(line.index, { fontFamily: event.target.value })}
                          className={`${fieldClass} min-h-[42px] px-3 py-2 text-sm`}
                        >
                          {AVAILABLE_FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm leading-6 text-[#aab8b0]">Generate a layout first, then each line will appear here.</div>
                  )}
                </div>
                </div>
              )}
              <button onClick={onClear} className="min-h-[48px] w-full rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] px-4 py-3 text-sm font-black text-[#ff9b7c]">
                Clear inscription layout
              </button>
            </div>
          )}
        </section>
      )}

      {activeStep === 6 && (
        <section className="space-y-4">
          <div className={`rounded-lg border p-4 text-sm leading-6 ${
            isProductionReady
              ? 'border-[#2f7f69]/35 bg-[#151f1b] text-[#1f755f]'
              : 'border-[#c6932e]/45 bg-[#221d12] text-[#e8c875]'
          }`}>
            <div className="font-black">{isProductionReady ? 'Your proof is ready' : 'Finish these steps before adding to basket'}</div>
            {isProductionReady ? (
              <p className="mt-1">The inscription layout and required portrait artwork are ready for your final review.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {readinessItems.filter(item => !item.ready).map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onGoToStep(item.step)}
                      className="w-full rounded-lg border border-[#c6932e]/45 bg-[#efe4d1] px-3 py-2 text-left text-xs font-black text-[#e8c875] transition hover:bg-[#fffaf0]"
                    >
                      {item.label} <span aria-hidden="true">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Final fine tune</div>
                <p className="mt-1 text-sm leading-6 text-[#6a746d]">
                  Adjust the proof without regenerating the portrait or text layout.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setFineTuneUnlocked((unlocked) => !unlocked)}
                  className={`min-h-[42px] rounded-full border px-4 text-xs font-black transition ${
                    fineTuneUnlocked
                      ? 'border-[#c6932e] bg-[#f2d688] text-[#1b231f]'
                      : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#2f3832]'
                  }`}
                >
                  {fineTuneUnlocked ? 'Lock fine tune' : 'Unlock fine tune'}
                </button>
                <button
                  onClick={() => onChange({
                    memorialImageScale: state.memorialImageEnabled ? 1.75 : 1,
                    memorialImageZoom: 1,
                    memorialImageOffsetX: 0,
                    memorialImageOffsetY: 0,
                    inscriptionScale: 1,
                    inscriptionOffsetX: 0,
                    inscriptionOffsetY: 0,
                    safeMargin: DEFAULT_SAFE_MARGIN_PERCENT,
                  })}
                  className="min-h-[42px] rounded-full border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] px-4 text-xs font-black text-[#2f3832]"
                >
                  Reset
                </button>
              </div>
            </div>
            {!fineTuneUnlocked && (
              <div className="mt-4 rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] p-3 text-xs font-bold leading-5 text-[#6a746d]">
                Fine tune is locked so the proof does not shift while scrolling. Unlock it before changing safe margin, picture, or text placement.
              </div>
            )}

            <div className="mt-4 rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Safe margin</div>
                  <div className="mt-1 text-sm font-black text-[#9a6a16]">
                    {safeMarginPercent}% · {Math.round(safeMarginMm)}mm from edge
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-black">
                  {SAFE_MARGIN_PRESETS.map(({ label, percent }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!fineTuneUnlocked}
                      onClick={() => onChange({ safeMargin: percent })}
                      className={`min-h-[34px] rounded-full border px-2 transition disabled:opacity-40 ${
                        safeMarginPercent === percent
                          ? 'border-[#c6932e] bg-[#f2d688] text-[#1b231f]'
                          : 'border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] text-[#2f3832]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="6"
                max="30"
                value={safeMarginPercent}
                disabled={!fineTuneUnlocked}
                onChange={(event) => onChange({ safeMargin: Number(event.target.value) })}
                className="mt-3 w-full accent-[#b98235] disabled:opacity-30"
                aria-label="Safe margin for text and portrait artwork"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FineTuneControl
                label="Picture scale"
                valueLabel={`${Math.round(state.memorialImageScale * 100)}%`}
                value={Math.round(state.memorialImageScale * 100)}
                min={5}
                max={1500}
                step={5}
                disabled={!state.memorialImageEnabled}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ memorialImageScale: value / 100 })}
              />
              <FineTuneControl
                label="Picture crop zoom"
                valueLabel={`${Math.round(state.memorialImageZoom * 100)}%`}
                value={Math.round(state.memorialImageZoom * 100)}
                min={5}
                max={1500}
                step={5}
                disabled={!state.memorialImageEnabled}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ memorialImageZoom: value / 100 })}
              />
              <FineTuneControl
                label="Text scale"
                valueLabel={`${Math.round(state.inscriptionScale * 100)}%`}
                value={Math.round(state.inscriptionScale * 100)}
                min={40}
                max={250}
                step={5}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ inscriptionScale: value / 100 })}
              />
              <FineTuneControl
                label="Picture left/right"
                valueLabel={`${state.memorialImageOffsetX}mm`}
                value={state.memorialImageOffsetX}
                min={-pictureOffsetXLimit}
                max={pictureOffsetXLimit}
                step={1}
                disabled={!state.memorialImageEnabled}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ memorialImageOffsetX: value })}
              />
              <FineTuneControl
                label="Text left/right"
                valueLabel={`${state.inscriptionOffsetX}mm`}
                value={state.inscriptionOffsetX}
                min={-30}
                max={30}
                step={1}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ inscriptionOffsetX: value })}
              />
              <FineTuneControl
                label="Picture up/down"
                valueLabel={`${state.memorialImageOffsetY}mm`}
                value={state.memorialImageOffsetY}
                min={-pictureOffsetYLimit}
                max={pictureOffsetYLimit}
                step={1}
                disabled={!state.memorialImageEnabled}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ memorialImageOffsetY: value })}
              />
              <FineTuneControl
                label="Text up/down"
                valueLabel={`${state.inscriptionOffsetY}mm`}
                value={state.inscriptionOffsetY}
                min={-30}
                max={30}
                step={1}
                locked={!fineTuneUnlocked}
                onChange={(value) => onChange({ inscriptionOffsetY: value })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Customer proof</div>
            <p className="mt-1 text-sm leading-6 text-[#6a746d]">
              Save your progress, check a realistic preview, or download a review copy.
            </p>
            <div className="mt-4 rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#f6efe2] p-3">
              <label className="block text-xs font-black uppercase tracking-wide text-[#6a746d]">
                Realistic scene prompt
              </label>
              <textarea
                value={realisticPreviewPrompt}
                onChange={(event) => onRealisticPreviewPromptChange(event.target.value)}
                placeholder="Example: luxury garden memorial hero image at golden hour, plaque mounted on natural stone, shallow depth of field, room for website headline on the left."
                className="mt-2 min-h-[112px] w-full resize-y rounded-lg border border-[rgba(84, 72, 52, 0.16)] bg-[#fffaf0] px-3 py-3 text-sm leading-6 text-[#1b231f] outline-none transition focus:border-[#c6932e] focus:ring-4 focus:ring-[#b98235]/20"
              />
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-[#6a746d]">
                  Ratio
                  <select
                    value={realisticPreviewAspectRatio}
                    onChange={(event) => onRealisticPreviewAspectRatioChange(event.target.value)}
                    className="min-h-[44px] rounded-lg border border-[rgba(84, 72, 52, 0.16)] bg-[#fffaf0] px-3 text-sm font-black normal-case tracking-normal text-[#1b231f] outline-none focus:border-[#c6932e] focus:ring-4 focus:ring-[#b98235]/20"
                  >
                    {REALISTIC_ASPECT_RATIOS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label} ({value})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex min-h-[44px] items-end pb-2 text-xs font-black uppercase tracking-wide text-[#9a6a16]">
                  4K
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={onSaveProof} className="min-h-[52px] rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] px-4 text-sm font-black text-[#2f3832]">
                Save proof
              </button>
              <button onClick={onRealisticPreview} className="col-span-2 min-h-[52px] rounded-lg bg-[#b98235] px-4 text-sm font-black text-[#1b231f]">
                Realistic preview
              </button>
              <button onClick={onExportPdf} className="min-h-[52px] rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] px-4 text-sm font-black text-[#2f3832]">
                Review PDF
              </button>
              <button onClick={onPrint} className="min-h-[52px] rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] px-4 text-sm font-black text-[#2f3832]">
                Print
              </button>
            </div>
          </div>

          <details className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
            <summary className="cursor-pointer text-sm font-black text-[#6a746d]">Production file for our workshop</summary>
            <p className="mt-2 text-xs leading-5 text-[#6a746d]">
              Workshop handoff file. Most customers will not need this download.
            </p>
            <button onClick={onExportSvg} className="mt-3 min-h-[48px] w-full rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] px-4 text-sm font-black text-[#2f3832]">
              Download workshop SVG
            </button>
          </details>

          <button
            onClick={onAddToBasket}
            disabled={!isProductionReady}
            className="studio-press min-h-[56px] w-full rounded-lg bg-[#f2d688] px-5 text-sm font-black text-[#1b231f] shadow-[0_14px_34px_rgba(216,177,95,0.18)] disabled:cursor-not-allowed disabled:bg-[#d8ceb9] disabled:text-[#8d8371] disabled:shadow-none"
          >
            {basketAdded ? 'Added to basket' : isProductionReady ? 'Add to basket' : 'Complete the checklist to add to basket'}
          </button>

          {basketAdded && (
            <div className="rounded-lg border border-[#2f7f69]/35 bg-[#151f1b] p-4 text-sm font-bold leading-6 text-[#1f755f]">
              Added to basket. This prototype now reaches a clear handoff point; checkout can be connected later.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
              <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Size</div>
              <div className="mt-1 text-lg font-black">{state.width} x {state.height}mm</div>
            </div>
            <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
              <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Estimate</div>
              <div className="mt-1 text-lg font-black">£{price}.00</div>
            </div>
            <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
              <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Wood</div>
              <div className="mt-1 text-lg font-black">{state.wood ? `+${formatPrice(woodAddOnPrice)}` : 'None'}</div>
            </div>
            <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4">
              <div className="text-xs font-black uppercase tracking-wide text-[#6a746d]">Layout</div>
              <div className="mt-1 text-lg font-black">{state.generatedSvgContent ? 'Fitted' : 'Draft'}</div>
            </div>
          </div>

          {state.aiReasoning && (
            <div className="rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-4 text-sm italic leading-6 text-[#6a746d]">
              {state.aiReasoning}
            </div>
          )}

          {state.conceptImageUrl && (
            <div className="overflow-hidden rounded-lg border border-[rgba(84, 72, 52, 0.14)] bg-[#fffaf0] p-2">
              <img src={state.conceptImageUrl} alt="AI design concept" className="h-auto w-full rounded-lg object-contain" />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
