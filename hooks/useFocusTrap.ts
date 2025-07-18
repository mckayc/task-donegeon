import { useEffect, RefObject } from 'react';

export function useFocusTrap(ref: RefObject<HTMLElement>) {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const focusableElements = element.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        firstElement.focus();
        element.addEventListener('keydown', handleKeyDown);

        return () => {
            element.removeEventListener('keydown', handleKeyDown);
        };
    }, [ref]);
}
