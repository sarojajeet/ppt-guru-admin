/**
 * fabricHelpers.js
 * Utilities for converting slide/document data <-> fabric.js canvas JSON.
 * Fabric.js v7 uses named exports: import { Canvas, Textbox, ... } from 'fabric'
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Standard 16:9 slide dimensions */
export const SLIDE_WIDTH = 960;
export const SLIDE_HEIGHT = 540;

/** A4 page dimensions at 96 DPI */
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

/** Zoom constraints */
export const ZOOM_MIN = 25;
export const ZOOM_MAX = 200;
export const ZOOM_STEP = 10;

/** Named slide background color presets */
export const SLIDE_BACKGROUNDS = {
  white: '#ffffff',
  dark: '#1e1e2e',
  blue: '#1d4ed8',
  green: '#166534',
};

/** Default font families available in the editor */
export const DEFAULT_FONT_FAMILIES = [
  'Manrope',
  'Mulish',
  'Arial',
  'Georgia',
  'Courier New',
  'Times New Roman',
];

/** Preset font sizes */
export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

// ─── Theme helpers ───────────────────────────────────────────────────────────

/**
 * Returns a set of colors for the given theme name.
 * @param {string} theme - One of 'white' | 'dark' | 'blue' | 'green'
 * @returns {{ background: string, title: string, content: string, accent: string }}
 */
export function getThemeColors(theme) {
  switch (theme) {
    case 'dark':
      return {
        background: SLIDE_BACKGROUNDS.dark,
        title: '#f1f5f9',
        content: '#cbd5e1',
        accent: '#818cf8',
      };
    case 'blue':
      return {
        background: SLIDE_BACKGROUNDS.blue,
        title: '#ffffff',
        content: '#dbeafe',
        accent: '#93c5fd',
      };
    case 'green':
      return {
        background: SLIDE_BACKGROUNDS.green,
        title: '#ffffff',
        content: '#dcfce7',
        accent: '#86efac',
      };
    case 'white':
    default:
      return {
        background: SLIDE_BACKGROUNDS.white,
        title: '#1e293b',
        content: '#334155',
        accent: '#3b82f6',
      };
  }
}

// ─── Slide data -> Fabric JSON ───────────────────────────────────────────────

/**
 * Converts a slide data object to a fabric.js canvas-compatible JSON structure.
 *
 * @param {{ title?: string, content?: string, bullets?: string[], formula?: string, table?: any }} slide
 * @param {string} [theme='white'] - Theme name ('white' | 'dark' | 'blue' | 'green')
 * @returns {{ version: string, objects: object[], background: string }}
 */
export function slideDataToFabricJSON(slide, theme = 'white') {
  if (!slide) {
    return { version: '7.1.0', objects: [], background: '#ffffff' };
  }

  const colors = getThemeColors(theme);
  const objects = [];
  let nextTop = 60;

  // Title
  if (slide.title) {
    objects.push({
      type: 'Textbox',
      name: 'title',
      left: 60,
      top: 60,
      width: 840,
      fontSize: 40,
      fontWeight: 'bold',
      fontFamily: 'Manrope, sans-serif',
      fill: colors.title,
      lineHeight: 1.2,
      text: slide.title,
      editable: true,
    });
    nextTop = 150;
  }

  // Content
  if (slide.content) {
    objects.push({
      type: 'Textbox',
      name: 'content',
      left: 60,
      top: nextTop,
      width: 840,
      fontSize: 20,
      fontFamily: 'Mulish, sans-serif',
      fill: colors.content,
      lineHeight: 1.6,
      text: slide.content,
      editable: true,
    });
    nextTop += 80;
  }

  // Bullets
  if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
    const bulletTop = slide.content ? nextTop : 170;
    const bulletText = slide.bullets.map((b) => `\u2022 ${b}`).join('\n');
    objects.push({
      type: 'Textbox',
      name: 'bullets',
      left: 60,
      top: bulletTop,
      width: 840,
      fontSize: 20,
      fontFamily: 'Mulish, sans-serif',
      fill: colors.content,
      lineHeight: 1.6,
      text: bulletText,
      editable: true,
    });
  }

  // Formula (rendered as monospace text)
  if (slide.formula) {
    objects.push({
      type: 'Textbox',
      name: 'formula',
      left: 60,
      top: nextTop + 60,
      width: 840,
      fontSize: 18,
      fontFamily: 'Courier New, monospace',
      fill: colors.content,
      lineHeight: 1.4,
      text: slide.formula,
      editable: true,
    });
  }

  // Table (render as grid-like text)
  if (slide.table && Array.isArray(slide.table) && slide.table.length > 0) {
    const tableText = slide.table.map((row) =>
      Array.isArray(row) ? row.join('\t') : String(row)
    ).join('\n');
    objects.push({
      type: 'Textbox',
      name: 'table',
      left: 60,
      top: nextTop + 60,
      width: 840,
      fontSize: 16,
      fontFamily: 'Courier New, monospace',
      fill: colors.content,
      lineHeight: 1.6,
      text: tableText,
      editable: true,
    });
  }

  // Watermark footer
  const watermarkBg = theme === 'white' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const watermarkTextColor = theme === 'white' ? '#94a3b8' : 'rgba(255,255,255,0.35)';

  objects.push({
    type: 'Rect',
    name: 'watermark',
    left: 0,
    top: SLIDE_HEIGHT - 32,
    width: SLIDE_WIDTH,
    height: 32,
    fill: watermarkBg,
    selectable: false,
    evented: false,
  });

  objects.push({
    type: 'Textbox',
    name: 'watermark-text',
    left: 0,
    top: SLIDE_HEIGHT - 28,
    width: SLIDE_WIDTH,
    height: 24,
    fontSize: 11,
    fontFamily: 'Mulish, sans-serif',
    fill: watermarkTextColor,
    text: 'AI PPT Generator',
    textAlign: 'center',
    selectable: false,
    evented: false,
    editable: false,
  });

  return {
    version: '7.1.0',
    objects,
    background: colors.background,
  };
}

// ─── Document section -> Fabric JSON ─────────────────────────────────────────

/**
 * Converts a document/notes section to fabric.js canvas JSON for an A4 page.
 *
 * @param {{ title?: string, content?: string, formulas?: string[], tables?: any[] }} section
 * @param {number} index - Section index (for reference)
 * @returns {{ version: string, objects: object[], background: string }}
 */
export function documentSectionToFabricJSON(section, index) {
  if (!section) {
    return { version: '7.1.0', objects: [], background: '#ffffff' };
  }

  const objects = [];
  let nextTop = 60;

  // Section title
  if (section.title) {
    objects.push({
      type: 'Textbox',
      name: 'section-title',
      left: 60,
      top: 60,
      width: 674,
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Manrope, sans-serif',
      fill: '#1e293b',
      lineHeight: 1.3,
      text: section.title,
      editable: true,
    });
    nextTop = 120;
  }

  // Content
  if (section.content) {
    objects.push({
      type: 'Textbox',
      name: 'section-content',
      left: 60,
      top: nextTop,
      width: 674,
      fontSize: 16,
      fontFamily: 'Mulish, sans-serif',
      fill: '#334155',
      lineHeight: 1.8,
      text: section.content,
      editable: true,
    });
    nextTop += 200;
  }

  // Formulas
  if (Array.isArray(section.formulas) && section.formulas.length > 0) {
    const formulaText = section.formulas.join('\n\n');
    objects.push({
      type: 'Textbox',
      name: 'section-formulas',
      left: 60,
      top: nextTop,
      width: 674,
      fontSize: 14,
      fontFamily: 'Courier New, monospace',
      fill: '#475569',
      lineHeight: 1.6,
      text: formulaText,
      editable: true,
    });
    nextTop += 100;
  }

  // Tables
  if (Array.isArray(section.tables) && section.tables.length > 0) {
    section.tables.forEach((table, i) => {
      if (!Array.isArray(table)) return;
      const tableText = table
        .map((row) => (Array.isArray(row) ? row.join('\t') : String(row)))
        .join('\n');
      objects.push({
        type: 'Textbox',
        name: `section-table-${i}`,
        left: 60,
        top: nextTop,
        width: 674,
        fontSize: 14,
        fontFamily: 'Courier New, monospace',
        fill: '#475569',
        lineHeight: 1.6,
        text: tableText,
        editable: true,
      });
      nextTop += 120;
    });
  }

  return {
    version: '7.1.0',
    objects,
    background: '#ffffff',
  };
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

/**
 * Creates an empty slide layout with placeholder title and content textboxes.
 *
 * @param {string} [theme='white'] - Theme name
 * @returns {{ version: string, objects: object[], background: string }}
 */
export function createSlideLayout(theme = 'white') {
  const colors = getThemeColors(theme);
  const placeholderColor = theme === 'white' ? '#94a3b8' : 'rgba(255,255,255,0.4)';

  return {
    version: '7.1.0',
    objects: [
      {
        type: 'Textbox',
        name: 'title-placeholder',
        left: 60,
        top: 60,
        width: 840,
        fontSize: 40,
        fontWeight: 'bold',
        fontFamily: 'Manrope, sans-serif',
        fill: placeholderColor,
        lineHeight: 1.2,
        text: 'Click to add title',
        editable: true,
      },
      {
        type: 'Textbox',
        name: 'content-placeholder',
        left: 60,
        top: 160,
        width: 840,
        fontSize: 20,
        fontFamily: 'Mulish, sans-serif',
        fill: placeholderColor,
        lineHeight: 1.6,
        text: 'Click to add content',
        editable: true,
      },
    ],
    background: colors.background,
  };
}

// ─── Object property extraction ──────────────────────────────────────────────

/**
 * Extracts a normalized properties object from a fabric.js object's JSON representation.
 *
 * @param {object} fabricObject - A fabric.js object JSON (from toObject())
 * @returns {object|null} Plain properties object, or null if input is falsy
 */
export function getObjectProperties(fabricObject) {
  if (!fabricObject) return null;

  const type = (fabricObject.type || '').toLowerCase();

  const base = {
    type,
    left: fabricObject.left ?? 0,
    top: fabricObject.top ?? 0,
    width: fabricObject.width ?? 0,
    height: fabricObject.height ?? 0,
    angle: fabricObject.angle ?? 0,
    opacity: fabricObject.opacity ?? 1,
    scaleX: fabricObject.scaleX ?? 1,
    scaleY: fabricObject.scaleY ?? 1,
    fill: fabricObject.fill ?? '',
    stroke: fabricObject.stroke ?? '',
    strokeWidth: fabricObject.strokeWidth ?? 0,
  };

  const isTextType = type === 'textbox' || type === 'text' || type === 'itext' || type === 'i-text';

  if (isTextType) {
    base.text = fabricObject.text ?? '';
    base.fontFamily = fabricObject.fontFamily ?? '';
    base.fontSize = fabricObject.fontSize ?? 16;
    base.fontWeight = fabricObject.fontWeight ?? 'normal';
    base.fontStyle = fabricObject.fontStyle ?? 'normal';
    base.underline = fabricObject.underline ?? false;
    base.linethrough = fabricObject.linethrough ?? false;
    base.textAlign = fabricObject.textAlign ?? 'left';
    base.lineHeight = fabricObject.lineHeight ?? 1.16;
    base.charSpacing = fabricObject.charSpacing ?? 0;
  }

  return base;
}

// ─── Apply properties ────────────────────────────────────────────────────────

/** Properties that only apply to text-type objects */
const TEXT_ONLY_PROPS = new Set([
  'text',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'underline',
  'linethrough',
  'textAlign',
  'lineHeight',
  'charSpacing',
]);

/**
 * Applies a set of properties to a live fabric.js object.
 * Silently skips text-specific properties when applied to non-text objects.
 *
 * @param {object} fabricObject - A live fabric.js object instance
 * @param {object} props - Key/value pairs to apply
 * @returns {object} The fabric.js object (for chaining)
 */
export function applyObjectProperties(fabricObject, props) {
  if (!fabricObject || !props) return fabricObject;

  const type = (fabricObject.type || '').toLowerCase();
  const isTextType = type === 'textbox' || type === 'text' || type === 'itext' || type === 'i-text';

  const safeProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (TEXT_ONLY_PROPS.has(key) && !isTextType) continue;
    safeProps[key] = value;
  }

  fabricObject.set(safeProps);
  return fabricObject;
}

// ─── Canvas export ───────────────────────────────────────────────────────────

/**
 * Exports a fabric.js canvas to a PNG data URL.
 *
 * @param {import('fabric').Canvas} fabricCanvas - A live fabric.js Canvas instance
 * @returns {string} Base64 data URL of the canvas
 */
export function canvasToDataURL(fabricCanvas) {
  if (!fabricCanvas) return '';
  return fabricCanvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 0.5 });
}
