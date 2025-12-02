import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer bg-white ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'
        } ${isOpen ? 'ring-2 ring-pink-500 border-transparent' : 'border-gray-300'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center">
          {selectedOption && !disabled && (
            <div
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full mr-1 cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-pink-50 ${
                    option.value === value
                      ? 'bg-pink-50 text-pink-700 font-medium'
                      : 'text-gray-700'
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
