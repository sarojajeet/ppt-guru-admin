export const SLIDE_W = 1120;
export const SLIDE_H = 630;

export const slideTransitionVariants = {
    enter: (direction) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -30 : 30, opacity: 0 }),
};

export const THEMES = [
    { name: "Corporate Blue", bg: "#1e3a5f", text: "#ffffff", accent: "#4da6ff", titleBg: "#16304f" },
    { name: "Dark Slate", bg: "#1e293b", text: "#e2e8f0", accent: "#818cf8", titleBg: "#0f172a" },
    { name: "Clean White", bg: "#ffffff", text: "#1e293b", accent: "#3b82f6", titleBg: "#f1f5f9" },
    { name: "Forest Green", bg: "#1a3a2a", text: "#d1fae5", accent: "#34d399", titleBg: "#0f2a1a" },
    { name: "Crimson", bg: "#3b0a0a", text: "#fee2e2", accent: "#f87171", titleBg: "#2b0000" },
    { name: "Midnight Purple", bg: "#1e1040", text: "#ede9fe", accent: "#a78bfa", titleBg: "#150a30" },
    { name: "Warm Amber", bg: "#2d1f00", text: "#fde68a", accent: "#fbbf24", titleBg: "#1a1200" },
    { name: "Ocean Teal", bg: "#083344", text: "#e0f2fe", accent: "#38bdf8", titleBg: "#042030" },
];

export const FONTS = ["Inter", "Roboto", "Poppins", "Montserrat", "Playfair Display", "Oswald", "Source Code Pro", "Georgia", "Arial", "Verdana"];
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

export const SHAPE_TYPES = [
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'rounded-rectangle', label: 'Rounded Rect' },
    { id: 'circle', label: 'Circle' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'line', label: 'Line' },
    { id: 'arrow', label: 'Arrow' },
    { id: 'star', label: 'Star' },
    { id: 'diamond', label: 'Diamond' },
];
