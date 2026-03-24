/**
 * mathSchema — ProseMirror schema with math_inline and math_display nodes
 *
 * Extends prosemirror-schema-basic with math node types from
 * @benrbray/prosemirror-math. Also adds text_color and font_size marks
 * for formatting support.
 */

import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';

export const mathSchema = new Schema({
    nodes: basicSchema.spec.nodes.append({
        math_inline: {
            group: 'inline math',
            content: 'text*',
            inline: true,
            atom: true,
            toDOM: () => ['math-inline', { class: 'math-node' }, 0],
            parseDOM: [{ tag: 'math-inline' }, { tag: 'span.math-node' }],
        },
        math_display: {
            group: 'block math',
            content: 'text*',
            atom: true,
            code: true,
            toDOM: () => ['math-display', { class: 'math-node' }, 0],
            parseDOM: [{ tag: 'math-display' }, { tag: 'div.math-node' }],
        },
    }),
    marks: basicSchema.spec.marks.append({
        text_color: {
            attrs: { color: { default: '#ffffff' } },
            parseDOM: [{
                style: 'color',
                getAttrs: (value) => ({ color: value }),
            }],
            toDOM: (mark) => ['span', { style: `color: ${mark.attrs.color}` }, 0],
        },
        font_size: {
            attrs: { size: { default: '16px' } },
            parseDOM: [{
                style: 'font-size',
                getAttrs: (value) => ({ size: value }),
            }],
            toDOM: (mark) => ['span', { style: `font-size: ${mark.attrs.size}` }, 0],
        },
    }),
});

/**
 * Parse plain text containing LaTeX delimiters into ProseMirror node JSON.
 * Recognizes: $...$, $$...$$, \(...\), \[...\]
 */
export function parseLatexTextToNodes(text) {
    if (!text) return [{ type: 'paragraph' }];

    const lines = text.split(/\r?\n/);
    const blockNodes = [];

    // Match LaTeX delimiters — order matters: $$ before $
    const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;

    for (const paragraphText of lines) {
        const inlineNodes = [];
        let lastIndex = 0;
        let match;

        regex.lastIndex = 0;

        while ((match = regex.exec(paragraphText)) !== null) {
            // Add any plain text before this match
            if (match.index > lastIndex) {
                inlineNodes.push({
                    type: 'text',
                    text: paragraphText.substring(lastIndex, match.index),
                });
            }

            const matchedStr = match[0];
            if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$') && matchedStr.length >= 4) {
                const mathContent = matchedStr.substring(2, matchedStr.length - 2).trim();
                inlineNodes.push({
                    type: 'math_display',
                    content: [{ type: 'text', text: mathContent }],
                });
            } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$') && !matchedStr.startsWith('$$') && matchedStr.length >= 2) {
                const mathContent = matchedStr.substring(1, matchedStr.length - 1).trim();
                inlineNodes.push({
                    type: 'math_inline',
                    content: [{ type: 'text', text: mathContent }],
                });
            } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
                const mathContent = matchedStr.substring(2, matchedStr.length - 2).trim();
                inlineNodes.push({
                    type: 'math_inline',
                    content: [{ type: 'text', text: mathContent }],
                });
            } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
                const mathContent = matchedStr.substring(2, matchedStr.length - 2).trim();
                inlineNodes.push({
                    type: 'math_display',
                    content: [{ type: 'text', text: mathContent }],
                });
            }

            lastIndex = regex.lastIndex;
        }

        // Add remaining plain text
        if (lastIndex < paragraphText.length) {
            inlineNodes.push({
                type: 'text',
                text: paragraphText.substring(lastIndex),
            });
        }

        if (inlineNodes.length === 0) {
            blockNodes.push({ type: 'paragraph' });
        } else {
            blockNodes.push({ type: 'paragraph', content: inlineNodes });
        }
    }

    return blockNodes.length > 0
        ? blockNodes
        : [{ type: 'paragraph', content: [{ type: 'text', text: text }] }];
}

/**
 * Serialize a ProseMirror document back to plain text with LaTeX delimiters.
 * This preserves the original format for the data model.
 */
export function prosemirrorDocToPlainText(doc) {
    if (!doc || !doc.content) return '';

    const lines = [];
    for (const block of doc.content) {
        if (!block.content || block.content.length === 0) {
            lines.push('');
            continue;
        }
        let line = '';
        for (const node of block.content) {
            if (node.type === 'math_inline') {
                const tex = node.content?.[0]?.text || '';
                line += `\\(${tex}\\)`;
            } else if (node.type === 'math_display') {
                const tex = node.content?.[0]?.text || '';
                line += `\\[${tex}\\]`;
            } else if (node.type === 'text') {
                line += node.text || '';
            }
        }
        lines.push(line);
    }
    return lines.join('\n');
}
