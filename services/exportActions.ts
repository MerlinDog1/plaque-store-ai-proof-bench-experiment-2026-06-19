// Export code is loaded when a proof download/production action is requested.
export const downloadCorelSvg: typeof import('./exportService').downloadCorelSvg = async (...args) => (await import('./exportService')).downloadCorelSvg(...args);
export const downloadPdf: typeof import('./exportService').downloadPdf = async (...args) => (await import('./exportService')).downloadPdf(...args);
export const svgToPngBase64: typeof import('./exportService').svgToPngBase64 = async (...args) => (await import('./exportService')).svgToPngBase64(...args);
export const svgToProofPngBase64: typeof import('./exportService').svgToProofPngBase64 = async (...args) => (await import('./exportService')).svgToProofPngBase64(...args);
export const createCorelPdfBlob: typeof import('./exportService').createCorelPdfBlob = async (...args) => (await import('./exportService')).createCorelPdfBlob(...args);
export const downloadCorelPdf: typeof import('./exportService').downloadCorelPdf = async (...args) => (await import('./exportService')).downloadCorelPdf(...args);
