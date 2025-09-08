import React, { useState, useEffect, useRef } from 'react';

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ selectedTags, onTagsChange, allTags, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue) {
      const filteredSuggestions = allTags.filter(
        tag =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.includes(tag)
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, allTags, selectedTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
    }
    setInputValue('');
    setSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestions.includes(inputValue.trim())) {
        addTag(inputValue);
      } else if (suggestions.length > 0) {
        addTag(suggestions[0]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center w-full px-2 py-1 bg-stone-700 border border-stone-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition" onClick={() => inputRef.current?.focus()}>
        {selectedTags.map(tag => (
          <div key={tag} className="flex items-center bg-emerald-600 text-white text-sm font-medium mr-2 my-1 px-2 py-1 rounded-full">
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 text-emerald-100 hover:text-white"
              aria-label={`Remove ${tag}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length > 0 ? '' : placeholder || 'Add tags...'}
          className="flex-grow bg-transparent border-none focus:ring-0 p-1 my-1 text-stone-200 placeholder-stone-400"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-stone-600 border border-stone-500 rounded-md shadow-lg max-h-40 overflow-y-auto scrollbar-hide">
          {suggestions.map(suggestion => (
            <li
              key={suggestion}
              onClick={() => addTag(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevents input from losing focus
              className="px-4 py-2 cursor-pointer hover:bg-emerald-700 text-stone-200"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;