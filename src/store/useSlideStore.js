import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSlideStore = create(
    persist(
        (set) => ({
            slides: [{ id: '1', fabricData: null, thumbnail: '' }],
            activeSlideId: '1',

            addSlide: () => {
                const newId = Date.now().toString() + Math.random().toString(36).substring(7);
                set((state) => ({
                    slides: [...state.slides, { id: newId, fabricData: null, thumbnail: '' }],
                    activeSlideId: newId,
                }));
            },

            setActiveSlide: (id) => set({ activeSlideId: id }),

            setSlides: (newSlides) =>
                set(() => ({
                    slides: newSlides,
                    activeSlideId: newSlides[0]?.id || null,
                })),

            updateSlideData: (id, fabricData, thumbnail) => {
                set((state) => ({
                    slides: state.slides.map((slide) =>
                        slide.id === id ? { ...slide, fabricData, thumbnail } : slide
                    ),
                }));
            },

            deleteSlide: (id) => {
                set((state) => {
                    const newSlides = state.slides.filter((slide) => slide.id !== id);

                    if (newSlides.length === 0) {
                        const newId = Date.now().toString();
                        return {
                            slides: [{ id: newId, fabricData: null, thumbnail: '' }],
                            activeSlideId: newId,
                        };
                    }

                    let newActiveId = state.activeSlideId;
                    if (state.activeSlideId === id) {
                        const deletedIndex = state.slides.findIndex((s) => s.id === id);
                        const nextSlide = newSlides[deletedIndex - 1] || newSlides[0];
                        newActiveId = nextSlide.id;
                    }

                    return {
                        slides: newSlides,
                        activeSlideId: newActiveId,
                    };
                });
            },
        }),
        { name: 'quantum-editor-storage' }
    )
);