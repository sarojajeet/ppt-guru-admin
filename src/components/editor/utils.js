import katex from 'katex';

/* ── Math rendering (KaTeX) ─────────────────────── */
export const renderMathInHtml = (html) => {
    if (!html) return '';
    let out = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        try { return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
        catch { return _; }
    });
    out = out.replace(/\\\((.*?)\\\)/g, (_, math) => {
        try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
        catch { return _; }
    });
    return out;
};

/* ── Element creators ────────────────────────────── */
let _elCounter = 0;
export const uid = () => `el-${Date.now()}-${++_elCounter}`;

export const createTextElement = (html = '<p>New Text</p>', x = 100, y = 100, opts = {}) => ({
    id: uid(), type: 'text',
    x, y, w: 400, h: 120,
    content: html,
    fontSize: 24, fontFamily: 'Inter',
    ...opts,
});

export const createImageElement = (src = '', x = 200, y = 150) => ({
    id: uid(), type: 'image',
    x, y, w: 300, h: 200,
    content: src,
});

export const createShapeElement = (shapeType = 'rectangle', x = 200, y = 150, opts = {}) => ({
    id: uid(), type: 'shape',
    shapeType,
    x, y, w: 200, h: 200,
    fill: opts.fill || 'rgba(77,166,255,0.3)',
    stroke: opts.stroke || '#4da6ff',
    strokeWidth: opts.strokeWidth ?? 2,
    ...opts,
});

export const defaultSlide = (idx = 0) => ({
    id: `slide-${Date.now()}-${idx}`,
    elements: [createTextElement(`<p>Slide ${idx + 1}</p>`, 50, 50, { w: 1020, fontSize: 48 })],
});

/* ── LaTeX detection ─────────────────────────────── */
export const containsLatex = (text) => {
    if (!text) return false;
    return /\\\([\s\S]*?\\\)/.test(text) || /\\\[[\s\S]*?\\\]/.test(text);
};

/* ── LaTeX → Unicode (for editable canvas text) ──── */
export const latexToUnicode = (text) => {
    if (!text) return '';
    let r = text;

    // 1. Strip LaTeX delimiters
    r = r.replace(/\\\(/g, '').replace(/\\\)/g, '');
    r = r.replace(/\\\[/g, '').replace(/\\\]/g, '');

    // 2. Resolve \text{...}, \mathrm{...}, \operatorname{...} FIRST
    //    (handles space between cmd and brace: \text {th } → th)
    r = r.replace(/\\(?:text|mathrm|mathbf|mathit|mathcal|mathbb|operatorname)\s*\{([^}]*)}/g,
        (_, c) => c.trim());

    // 3. Trig / math function names: \sin → sin, \cos → cos, etc.
    const funcs = [
        'sin','cos','tan','cot','sec','csc','cosec',
        'arcsin','arccos','arctan','sinh','cosh','tanh',
        'log','ln','exp','lim','max','min','det','gcd','deg','dim','ker','arg',
    ];
    for (const f of funcs) {
        r = r.replace(new RegExp(`\\\\${f}(?![a-zA-Z])`, 'g'), f);
    }

    // 4. Greek letters
    const greek = {
        alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',zeta:'ζ',eta:'η',
        theta:'θ',iota:'ι',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',pi:'π',
        rho:'ρ',sigma:'σ',tau:'τ',upsilon:'υ',phi:'φ',chi:'χ',psi:'ψ',omega:'ω',
        Alpha:'Α',Beta:'Β',Gamma:'Γ',Delta:'Δ',Theta:'Θ',Lambda:'Λ',Xi:'Ξ',
        Pi:'Π',Sigma:'Σ',Phi:'Φ',Psi:'Ψ',Omega:'Ω',
    };
    for (const [n, c] of Object.entries(greek)) {
        r = r.replace(new RegExp(`\\\\${n}(?![a-zA-Z])`, 'g'), c);
    }

    // 5. Symbols & operators
    const sym = {
        '\\sum':'∑','\\prod':'∏','\\int':'∫','\\infty':'∞','\\partial':'∂',
        '\\nabla':'∇','\\pm':'±','\\mp':'∓','\\times':'×','\\div':'÷',
        '\\cdot':'·','\\bullet':'•','\\circ':'∘','\\leq':'≤','\\geq':'≥',
        '\\neq':'≠','\\approx':'≈','\\equiv':'≡','\\sim':'∼',
        '\\subset':'⊂','\\supset':'⊃','\\subseteq':'⊆','\\supseteq':'⊇',
        '\\cup':'∪','\\cap':'∩','\\in':'∈','\\notin':'∉',
        '\\forall':'∀','\\exists':'∃',
        '\\Rightarrow':'⇒','\\Leftarrow':'⇐','\\Leftrightarrow':'⇔',
        '\\rightarrow':'→','\\leftarrow':'←','\\leftrightarrow':'↔',
        '\\ldots':'…','\\cdots':'⋯','\\vdots':'⋮',
        '\\langle':'⟨','\\rangle':'⟩',
        '\\lfloor':'⌊','\\rfloor':'⌋','\\lceil':'⌈','\\rceil':'⌉',
        '\\triangle':'△','\\angle':'∠','\\|':'∥','\\parallel':'∥',
    };
    for (const [cmd, ch] of Object.entries(sym)) {
        r = r.replace(new RegExp(cmd.replace(/[\\|]/g, '\\$&'), 'g'), ch);
    }

    // 6. \sqrt{x} → √(x) — balanced brace matching for nested sqrt
    r = (function replaceSqrt(s) {
        let out = '', i = 0;
        while (i < s.length) {
            if (s.startsWith('\\sqrt', i)) {
                let j = i + 5;
                // skip optional whitespace before brace
                let jj = j;
                while (jj < s.length && s[jj] === ' ') jj++;
                if (jj < s.length && s[jj] === '{') {
                    // find matching closing brace (counting depth)
                    let depth = 1, k = jj + 1;
                    while (k < s.length && depth > 0) {
                        if (s[k] === '{') depth++;
                        else if (s[k] === '}') depth--;
                        k++;
                    }
                    const inner = replaceSqrt(s.slice(jj + 1, k - 1));
                    out += '√' + inner;
                    i = k;
                } else {
                    out += '√';
                    i = j; // past \sqrt, don't consume spaces when no brace
                }
            } else {
                out += s[i];
                i++;
            }
        }
        return out;
    })(r);

    // 7. Superscripts ^{...} → Unicode  (BEFORE \frac so nested braces resolve)
    const sup = {
        '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
        '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾',
        'n':'ⁿ','i':'ⁱ','a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ',
        'h':'ʰ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ',
        't':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
    };
    const toSup = (c) => c.split('').map(ch => sup[ch] || ch).join('');
    r = r.replace(/\^\s*\{([^}]*)}/g, (_, c) => toSup(c.trim()));
    r = r.replace(/\^([0-9a-zA-Z])/g, (_, c) => sup[c] || `^${c}`);

    // 8. Subscripts _{...} → Unicode
    const sub = {
        '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
        '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎',
        'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ',
        'o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ',
    };
    const toSub = (c) => c.split('').map(ch => sub[ch] || ch).join('');
    r = r.replace(/_\s*\{([^}]*)}/g, (_, c) => toSub(c.trim()));
    r = r.replace(/_([0-9a-zA-Z])/g, (_, c) => sub[c] || `_${c}`);

    // 9. \frac{num}{den} → smart fraction (inner braces already resolved)
    const unicodeFracs = {
        '1/2':'½','1/3':'⅓','2/3':'⅔','1/4':'¼','3/4':'¾',
        '1/5':'⅕','2/5':'⅖','3/5':'⅗','4/5':'⅘',
        '1/6':'⅙','5/6':'⅚','1/8':'⅛','3/8':'⅜','5/8':'⅝','7/8':'⅞',
    };
    r = r.replace(/\\frac\s*\{([^}]*)}\s*\{([^}]*)}/g, (_, num, den) => {
        const n = num.trim(), d = den.trim();
        const key = `${n}/${d}`;
        if (unicodeFracs[key]) return unicodeFracs[key];
        const simple = (s) => /^[\w.αβγδεθπσφ]+$/.test(s);
        if (simple(n) && simple(d)) return `${n}/${d}`;
        return `(${n})/(${d})`;
    });

    // 10. Strip \left / \right (keep the delimiter that follows)
    r = r.replace(/\\(?:left|right)\s*/g, '');

    // 11. Strip remaining \commands (unknown)
    r = r.replace(/\\[a-zA-Z]+/g, '');

    // 12. Remove grouping braces (empty ones first, then content ones)
    r = r.replace(/\{\s*}/g, '');
    r = r.replace(/\{([^}]*)}/g, '$1');

    // 13. Clean whitespace
    r = r.replace(/\s+/g, ' ').trim();

    return r;
};

/* ── HTML → plain text (for Fabric Textbox) ──────── */
export const htmlToPlainText = (html) => {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p><p>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
};

/* ── Parse API content -> slides ─────────────────── */
export const extractImages = (text) => {
    if (!text) return { cleanText: '', imageUrls: [] };
    const imageUrls = [];
    const mdMatches = [...text.matchAll(/!\[.*?\]\((.*?)\)/g)];
    mdMatches.forEach(m => imageUrls.push(m[1]));
    let cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').trim();
    const bareUrlRegex = /(?:^|\s)(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:\?\S*)?)/gi;
    const bareMatches = [...cleanText.matchAll(bareUrlRegex)];
    bareMatches.forEach(m => imageUrls.push(m[1].trim()));
    cleanText = cleanText.replace(bareUrlRegex, '').trim();
    return { cleanText, imageUrls };
};

export const textToHtml = (text) => {
    if (!text) return '';
    return text.split('\n').filter(Boolean).map(line => `<p>${line}</p>`).join('');
};

export const buildSlideElements = (heading, bodyText) => {
    const { cleanText, imageUrls } = extractImages(bodyText);
    const elements = [];

    if (imageUrls.length > 0) {
        elements.push(createTextElement(`<p><strong>${heading}</strong></p>`, 30, 20, { w: 580, fontSize: 36 }));
        if (cleanText) elements.push(createTextElement(textToHtml(cleanText), 30, 100, { w: 580, h: 480, fontSize: 18 }));
        imageUrls.forEach((url, i) => elements.push(createImageElement(url, 640, 20 + i * 260)));
    } else {
        elements.push(createTextElement(`<p><strong>${heading}</strong></p>`, 50, 30, { w: 1020, fontSize: 36 }));
        if (cleanText) elements.push(createTextElement(textToHtml(cleanText), 50, 120, { w: 1020, h: 460, fontSize: 20 }));
    }
    return elements;
};

export const parseSlides = (rawData) => {
    if (!rawData) return [defaultSlide(0)];

    if (typeof rawData === 'object' && !Array.isArray(rawData)) {
        const sections = rawData.sections || rawData.aiContent?.sections || [];
        const title = rawData.title || rawData.aiContent?.title || '';
        if (sections.length > 0) {
            const slides = [];
            if (title) {
                const ts = defaultSlide(0);
                ts.elements = [
                    createTextElement(`<p><strong>${title}</strong></p>`, 50, 50, { w: 1020, fontSize: 48 }),
                    createTextElement('<p>Generated by NeuralNotes AI</p>', 50, 200, { w: 1020, h: 60, fontSize: 20 }),
                ];
                slides.push(ts);
            }
            sections.forEach((sec, idx) => {
                const text = typeof sec === 'string' ? sec : (sec.text || sec.content || '');
                if (!text.trim()) return;
                const heading = (typeof sec === 'object' && sec.heading) ? sec.heading : `Section ${idx + 1}`;
                const s = defaultSlide(slides.length);
                s.elements = buildSlideElements(heading, text);
                slides.push(s);
            });
            return slides.length > 0 ? slides : [defaultSlide(0)];
        }
    }

    const text = typeof rawData === 'string' ? rawData : rawData.data || rawData.content || '';
    if (!text) return [defaultSlide(0)];
    const parts = text.split(/Slide\s+\d+:/i).filter(Boolean);
    if (parts.length === 0) {
        const s = defaultSlide(0);
        s.elements = buildSlideElements('Document', text);
        return [s];
    }
    return parts.map((body, idx) => {
        const s = defaultSlide(idx);
        s.elements = buildSlideElements(`Slide ${idx + 1}`, body.trim());
        return s;
    });
};
