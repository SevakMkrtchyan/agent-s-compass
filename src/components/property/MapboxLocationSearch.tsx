import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAddresses, parseLocation, formatLocationForSearch, GeocodingResult } from '@/lib/mapbox-geocoding';

interface MapboxLocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onLocationSelect?: (location: string, fullAddress: string) => void;
  placeholder?: string;
  className?: string;
}

export function MapboxLocationSearch({
  value,
  onChange,
  onSearch,
  onLocationSelect,
  placeholder = "Search address, city, or ZIP...",
  className,
}: MapboxLocationSearchProps) {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const debouncedQuery = useDebounce(value, 300);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchAddresses(debouncedQuery, {
          types: ['address', 'place', 'postcode', 'neighborhood'],
          limit: 6,
        });
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelect = useCallback((result: GeocodingResult) => {
    const parsed = parseLocation(result);
    const searchLocation = formatLocationForSearch(parsed);
    
    onChange(result.place_name);
    onLocationSelect?.(searchLocation, result.place_name);
    setSuggestions([]);
    setIsOpen(false);
  }, [onChange, onLocationSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        } else {
          onSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelect, onSearch]);

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeIcon = (id: string) => {
    if (id.startsWith('address')) return '🏠';
    if (id.startsWith('place')) return '🏙️';
    if (id.startsWith('postcode')) return '📮';
    if (id.startsWith('neighborhood')) return '🏘️';
    return '📍';
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : value ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((result, index) => {
            const parsed = parseLocation(result);
            return (
              <li
                key={result.id}
                onClick={() => handleSelect(result)}
                className={cn(
                  "px-3 py-2.5 cursor-pointer transition-colors flex items-start gap-3",
                  index === highlightedIndex 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-muted"
                )}
              >
                <span className="text-base mt-0.5">{getTypeIcon(result.id)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {result.text}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {parsed.city && parsed.stateCode 
                      ? `${parsed.city}, ${parsed.stateCode}${parsed.zipCode ? ` ${parsed.zipCode}` : ''}`
                      : result.place_name
                    }
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Empty state when focused with no results */}
      {isOpen && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center">
          <MapPin className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No locations found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
