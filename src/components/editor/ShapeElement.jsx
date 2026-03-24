import { memo } from 'react';

const SHAPE_PATHS = {
    'rectangle': (fill, stroke, sw) => (
        <rect x={sw} y={sw} width={100 - sw * 2} height={100 - sw * 2} fill={fill} stroke={stroke} strokeWidth={sw} />
    ),
    'rounded-rectangle': (fill, stroke, sw) => (
        <rect x={sw} y={sw} width={100 - sw * 2} height={100 - sw * 2} rx="12" ry="12" fill={fill} stroke={stroke} strokeWidth={sw} />
    ),
    'circle': (fill, stroke, sw) => (
        <ellipse cx="50" cy="50" rx={50 - sw} ry={50 - sw} fill={fill} stroke={stroke} strokeWidth={sw} />
    ),
    'triangle': (fill, stroke, sw) => (
        <polygon points="50,5 95,95 5,95" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    ),
    'line': (_fill, stroke, sw) => (
        <line x1="5" y1="95" x2="95" y2="5" stroke={stroke} strokeWidth={Math.max(sw, 3)} strokeLinecap="round" />
    ),
    'arrow': (_fill, stroke, sw) => (
        <g stroke={stroke} strokeWidth={Math.max(sw, 3)} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1="5" y1="50" x2="85" y2="50" />
            <polyline points="70,30 90,50 70,70" />
        </g>
    ),
    'star': (fill, stroke, sw) => (
        <polygon
            points="50,5 61,38 95,38 68,60 79,93 50,73 21,93 32,60 5,38 39,38"
            fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
        />
    ),
    'diamond': (fill, stroke, sw) => (
        <polygon points="50,3 97,50 50,97 3,50" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    ),
};

const ShapeElement = memo(function ShapeElement({ element }) {
    const { shapeType = 'rectangle', fill = 'rgba(77,166,255,0.3)', stroke = '#4da6ff', strokeWidth = 2 } = element;
    const renderer = SHAPE_PATHS[shapeType] || SHAPE_PATHS['rectangle'];

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
        >
            {renderer(fill, stroke, strokeWidth)}
        </svg>
    );
});

export const ShapePreview = memo(function ShapePreview({ shapeType, size = 40 }) {
    const renderer = SHAPE_PATHS[shapeType] || SHAPE_PATHS['rectangle'];
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" width={size} height={size}>
            {renderer('rgba(77,166,255,0.25)', '#4da6ff', 3)}
        </svg>
    );
});

export default ShapeElement;
