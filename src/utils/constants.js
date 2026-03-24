/**
 * App-wide Constants
 */

// Responsive breakpoints (matches CSS modules)
export const BREAKPOINTS = {
  small: 480,
  tablet: 768,
  desktop: 1024,
};

// API configuration
export const API_CONFIG = {
  mathpixUrl: 'https://api.mathpix.com/v3',
  mathpixAppId: import.meta.env.VITE_MATHPIX_APP_ID || '',
  mathpixAppKey: import.meta.env.VITE_MATHPIX_APP_KEY || '',
};

// File limits
export const FILE_LIMITS = {
  maxSize: 20 * 1024 * 1024, // 20MB
  supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
};

// App steps
export const STEPS = {
  UPLOAD: 1,
  SELECT_OUTPUT: 2,
  EXPORT: 3,
};

// Output types
export const OUTPUT_TYPES = {
  PPT: 'ppt',
  NOTES: 'notes',
};

// Export formats
export const EXPORT_FORMATS = {
  PPTX: 'pptx',
  PDF: 'pdf',
  DOCX: 'docx',
};

// Routes
export const ROUTES = {
  HOME: '/',
  PROCESSING: '/processing',
  EDITOR: '/editor',
};
