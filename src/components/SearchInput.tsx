import React, { useRef, memo } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  onSearchChange: (value: string) => void;
  debounceMs?: number;
}

const SearchInputComponent: React.FC<SearchInputProps> = ({ onSearchChange, debounceMs = 300 }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, debounceMs);
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Hledat podle názvu, EAN, značky, kategorie nebo podkategorie..."
          defaultValue=""
          onChange={handleChange}
          autoComplete="off"
          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

// NEVER re-render this component, even if props change
export const SearchInput = memo(SearchInputComponent, () => true);
