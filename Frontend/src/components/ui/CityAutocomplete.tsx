import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  cities: string[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function CityAutocomplete({ 
  value, 
  onChange, 
  cities, 
  placeholder = "Buscar cidade...", 
  className = "",
  icon = <MapPin size={16} className="text-gray-400 flex-shrink-0" />
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(value); // Reseta a busca se não clicou numa opção
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredCities = cities.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className={`relative flex items-center ${className}`}>
      {icon && <div className="mr-2">{icon}</div>}
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') {
             onChange('');
          }
        }}
        onFocus={() => setIsOpen(true)}
        className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent w-full"
      />
      {isOpen && filteredCities.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto custom-scrollbar py-1">
          {filteredCities.map((city) => (
            <li
              key={city}
              onMouseDown={(e) => {
                // onMouseDown executa antes do onBlur do input
                e.preventDefault();
                setSearch(city);
                onChange(city);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer transition-colors"
            >
              {city}
            </li>
          ))}
        </ul>
      )}
      {isOpen && search !== '' && filteredCities.length === 0 && (
         <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
           Nenhuma cidade encontrada
         </div>
      )}
    </div>
  );
}
