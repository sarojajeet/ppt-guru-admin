import { memo } from 'react';
import { Icon } from '@iconify/react';

const ImageElement = memo(function ImageElement({ element, onContentChange }) {
    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onContentChange(ev.target.result);
        reader.readAsDataURL(file);
    };

    if (element.content) {
        return <img src={element.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />;
    }

    return (
        <label style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            border: '2px dashed var(--nn-border-hover)', borderRadius: 8, opacity: 0.7,
        }}>
            <Icon icon="fa-solid:image" style={{ fontSize: 36, color: 'var(--nn-accent-sky)' }} />
            <span style={{ fontSize: 11, marginTop: 6, color: 'var(--nn-text-secondary)' }}>Click to Upload</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        </label>
    );
});

export default ImageElement;
