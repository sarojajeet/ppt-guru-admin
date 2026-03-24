import { useEffect, memo, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { renderMathInHtml } from './utils';

const TipTapTextElement = memo(function TipTapTextElement({ element, theme, isSelected, isEditing, onContentChange, onEditorReady, onStartEdit }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            FontFamily,
            Underline,
            Placeholder.configure({ placeholder: 'Type here...' }),
        ],
        content: element.content || '<p></p>',
        editable: false,
        onUpdate: ({ editor: ed }) => {
            onContentChange(ed.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(isEditing || isSelected);
        if (isEditing) {
            const currentHtml = editor.getHTML();
            if (element.content && element.content !== currentHtml) {
                editor.commands.setContent(element.content, false);
            }
            setTimeout(() => editor.commands.focus('end'), 30);
            onEditorReady?.(editor);
        } else if (isSelected) {
            onEditorReady?.(editor);
        } else {
            onEditorReady?.(null);
        }
    }, [isEditing, isSelected, editor]);

    const textColor = element.color || theme.text;
    const renderedContent = useMemo(() => renderMathInHtml(element.content || ''), [element.content]);

    return (
        <div
            onClick={(e) => {
                if (isSelected && !isEditing && onStartEdit) {
                    e.stopPropagation();
                    onStartEdit();
                }
            }}
            onDoubleClick={(e) => { e.stopPropagation(); }}
            style={{
                width: '100%', height: '100%', padding: 8,
                fontSize: element.fontSize || 24,
                fontFamily: element.fontFamily || 'Inter',
                color: textColor,
                cursor: isEditing ? 'text' : 'pointer',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <div style={{
                width: '100%', height: '100%',
                position: isEditing ? 'relative' : 'absolute',
                top: 0, left: 0,
                opacity: isEditing ? 1 : 0,
                pointerEvents: isEditing ? 'auto' : 'none',
                zIndex: isEditing ? 1 : -1,
            }}>
                <EditorContent editor={editor} style={{ width: '100%', height: '100%' }} />
            </div>
            {!isEditing && (
                <div
                    style={{ width: '100%', height: '100%' }}
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
            )}
        </div>
    );
});

export default TipTapTextElement;
