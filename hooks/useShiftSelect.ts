import { useRef, useCallback } from 'react';

// Custom hook for shift-selection logic on checkboxes
export function useShiftSelect<T extends string | number>(
  // The full list of item IDs in the order they are rendered.
  allItems: T[],
  // The current list of selected item IDs.
  selectedItems: T[],
  // The setter function for the selected items state.
  setSelectedItems: (setter: (prev: T[]) => T[]) => void
) {
  // Ref to store the ID of the last clicked checkbox.
  const lastCheckedId = useRef<T | null>(null);

  const handleCheckboxClick = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    clickedId: T
  ) => {
    const isShiftClick = event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey;
    const isChecked = event.target.checked;

    if (isShiftClick && lastCheckedId.current && lastCheckedId.current !== clickedId) {
      const lastIndex = allItems.indexOf(lastCheckedId.current);
      const currentIndex = allItems.indexOf(clickedId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = allItems.slice(start, end + 1);
        
        setSelectedItems(prev => {
            const newSelectedItems = new Set(prev);
            // Apply the state of the currently clicked checkbox to the entire range.
            if (isChecked) {
              rangeIds.forEach(id => newSelectedItems.add(id));
            } else {
              rangeIds.forEach(id => newSelectedItems.delete(id));
            }
            return Array.from(newSelectedItems);
        });
      }
    } else {
      // Normal click behavior
      setSelectedItems(prev => {
          const newSelectedItems = new Set(prev);
          if (isChecked) {
            newSelectedItems.add(clickedId);
          } else {
            newSelectedItems.delete(clickedId);
          }
          return Array.from(newSelectedItems);
      });
    }

    // Update the last checked ID for the next shift-click operation.
    lastCheckedId.current = clickedId;
  }, [allItems, setSelectedItems]);

  return handleCheckboxClick;
}
