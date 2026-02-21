import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useSlideStore } from '../store/useSlideStore';
import katex from 'katex';
import html2canvas from 'html2canvas';

export const useFabric = () => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const [activeObject, setActiveObject] = useState(null);
    const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');

    const { activeSlideId } = useSlideStore();
    const isSettingSlide = useRef(false);

    const undoStack = useRef([]);
    const redoStack = useRef([]);
    const isHistoryProcessing = useRef(false);
    const clipboard = useRef(null);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 960,
            height: 540,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            selection: true
        });

        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: '#ffffff',
            cornerStrokeColor: '#6366f1',
            borderColor: '#6366f1',
            cornerSize: 10,
            padding: 5,
            cornerStyle: 'circle'
        });

        const updateSelection = () => setActiveObject(canvas.getActiveObject());

        canvas.on('selection:created', updateSelection);
        canvas.on('selection:updated', updateSelection);
        canvas.on('selection:cleared', () => setActiveObject(null));

        const saveState = () => {
            if (isSettingSlide.current || isHistoryProcessing.current) return;

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(() => {
                if (!fabricRef.current) return;
                const currentSlideId = useSlideStore.getState().activeSlideId;
                const json = fabricRef.current.toJSON();

                undoStack.current.push(JSON.stringify(json));
                redoStack.current = [];

                useSlideStore.getState().updateSlideData(
                    currentSlideId,
                    json,
                    fabricRef.current.toDataURL({ format: 'png', multiplier: 0.3 })
                );
            }, 400);
        };

        canvas.on('object:added', saveState);
        canvas.on('object:modified', saveState);
        canvas.on('object:removed', saveState);

        fabricRef.current = canvas;
        return () => canvas.dispose();
    }, []);

    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const canvas = fabricRef.current;
        if (!canvas) return;

        const activeSlide = useSlideStore.getState().slides.find(s => s.id === activeSlideId);
        isSettingSlide.current = true;

        const finalizeSlideLoad = () => {
            canvas.requestRenderAll();
            isSettingSlide.current = false;
            undoStack.current = [JSON.stringify(canvas.toJSON())];
            redoStack.current = [];
        };

        if (activeSlide && activeSlide.fabricData) {
            canvas.loadFromJSON(activeSlide.fabricData, () => {
                setCanvasBgColor(canvas.backgroundColor || '#ffffff');
                finalizeSlideLoad();
            });
        } else {
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            setCanvasBgColor('#ffffff');
            finalizeSlideLoad();
        }

        setActiveObject(null);
    }, [activeSlideId]);

    const undo = useCallback(() => {
        if (!fabricRef.current || undoStack.current.length <= 1) return;

        isHistoryProcessing.current = true;
        const currentState = undoStack.current.pop();
        redoStack.current.push(currentState);
        const previousState = undoStack.current[undoStack.current.length - 1];

        fabricRef.current.loadFromJSON(JSON.parse(previousState), () => {
            fabricRef.current.requestRenderAll();
            setCanvasBgColor(fabricRef.current.backgroundColor || '#ffffff');
            isHistoryProcessing.current = false;

            const currentSlideId = useSlideStore.getState().activeSlideId;
            useSlideStore.getState().updateSlideData(
                currentSlideId,
                JSON.parse(previousState),
                fabricRef.current.toDataURL({ format: 'png', multiplier: 0.3 })
            );
        });
    }, []);

    const redo = useCallback(() => {
        if (!fabricRef.current || redoStack.current.length === 0) return;

        isHistoryProcessing.current = true;
        const nextState = redoStack.current.pop();
        undoStack.current.push(nextState);

        fabricRef.current.loadFromJSON(JSON.parse(nextState), () => {
            fabricRef.current.requestRenderAll();
            setCanvasBgColor(fabricRef.current.backgroundColor || '#ffffff');
            isHistoryProcessing.current = false;

            const currentSlideId = useSlideStore.getState().activeSlideId;
            useSlideStore.getState().updateSlideData(
                currentSlideId,
                JSON.parse(nextState),
                fabricRef.current.toDataURL({ format: 'png', multiplier: 0.3 })
            );
        });
    }, []);

    const deleteObject = useCallback(() => {
        const active = fabricRef.current?.getActiveObjects();
        if (active && active.length) {
            active.forEach(obj => fabricRef.current.remove(obj));
            fabricRef.current.discardActiveObject();
            fabricRef.current.requestRenderAll();
        }
    }, []);

    const copyObject = useCallback(async () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) clipboard.current = await activeObject.clone();
    }, []);

    const pasteObject = useCallback(async () => {
        if (!clipboard.current || !fabricRef.current) return;

        const clonedObj = await clipboard.current.clone();
        fabricRef.current.discardActiveObject();
        clonedObj.set({ left: clonedObj.left + 20, top: clonedObj.top + 20, evented: true });

        fabricRef.current.add(clonedObj);
        fabricRef.current.setActiveObject(clonedObj);
        fabricRef.current.requestRenderAll();
        fabricRef.current.fire('object:modified');
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
            const activeObj = fabricRef.current?.getActiveObject();
            const isEditingText = activeObj && activeObj.isEditing;
            if (isInput || isEditingText) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copyObject(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteObject(); }
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteObject(); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, copyObject, pasteObject, deleteObject]);

    const updateBackgroundColor = useCallback((color) => {
        if (!fabricRef.current) return;
        fabricRef.current.backgroundColor = color;
        setCanvasBgColor(color);
        fabricRef.current.requestRenderAll();
        fabricRef.current.fire('object:modified');
    }, []);

    const clearCanvas = useCallback(() => {
        if (!fabricRef.current) return;
        if (window.confirm("Delete entire slide?")) {
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = '#ffffff';
            setCanvasBgColor('#ffffff');
            fabricRef.current.requestRenderAll();
            fabricRef.current.fire('object:modified');
        }
    }, []);

    const addRect = useCallback(() => {
        const rect = new fabric.Rect({ left: 100, top: 100, width: 100, height: 100, fill: '#6366f1' });
        fabricRef.current.add(rect);
        fabricRef.current.setActiveObject(rect);
    }, []);

    const addCircle = useCallback(() => {
        const circle = new fabric.Circle({ left: 300, top: 100, radius: 50, fill: '#ef4444' });
        fabricRef.current.add(circle);
        fabricRef.current.setActiveObject(circle);
    }, []);

    const addText = useCallback(() => {
        const text = new fabric.IText('Double Click to Edit', { left: 400, top: 200, fontSize: 30, fill: '#1e293b' });
        fabricRef.current.add(text);
        fabricRef.current.setActiveObject(text);
    }, []);

    const handleImageUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (f) => {
            const img = await fabric.Image.fromURL(f.target.result);
            img.scaleToWidth(300);
            fabricRef.current.add(img);
            fabricRef.current.centerObject(img);
            fabricRef.current.setActiveObject(img);
            fabricRef.current.requestRenderAll();
            fabricRef.current.fire('object:modified');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, []);

    const downloadCanvas = useCallback(() => {
        const link = document.createElement('a');
        link.href = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
        link.download = `Slide-${Date.now()}.png`;
        link.click();
    }, []);

    const addMathEquation = useCallback(async (latex) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);

        try {
            katex.render(latex, tempDiv, { throwOnError: false, displayMode: true });
            const canvas = await html2canvas(tempDiv, { backgroundColor: null, scale: 3 });
            const img = await fabric.Image.fromURL(canvas.toDataURL());
            img.scaleToWidth(250);
            fabricRef.current.add(img);
            fabricRef.current.centerObject(img);
            fabricRef.current.setActiveObject(img);
            fabricRef.current.requestRenderAll();
            fabricRef.current.fire('object:modified');
        } finally {
            document.body.removeChild(tempDiv);
        }
    }, []);

    return {
        canvasRef,
        activeObject,
        addRect,
        addCircle,
        addText,
        deleteObject,
        handleImageUpload,
        downloadCanvas,
        addMathEquation,
        undo,
        redo,
        canvasBgColor,
        updateBackgroundColor,
        clearCanvas
    };
};