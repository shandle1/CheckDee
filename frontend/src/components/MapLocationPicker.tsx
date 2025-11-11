import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { getMapboxTileUrl, getMapboxAttribution, searchPlaces, reverseGeocode, GeocodingResult } from '@/lib/mapbox';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onClose: () => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Component to handle map clicks
function LocationMarker({
  position,
  setPosition,
  setAddress,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
  setAddress: (address: string) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      // Get address from coordinates
      try {
        const address = await reverseGeocode(lng, lat);
        setAddress(address);
      } catch (error) {
        console.error('Failed to get address:', error);
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function MapLocationPicker({
  onLocationSelect,
  onClose,
  initialLocation,
}: MapLocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : null
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Default center (Bangkok, Thailand)
  const defaultCenter: [number, number] = [13.7563, 100.5018];
  const mapCenter = position || defaultCenter;

  // Handle search input with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(searchQuery, {
          limit: 5,
          proximity: position ? [position[1], position[0]] : undefined,
        });
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, position]);

  const handleSearchResultClick = (result: GeocodingResult) => {
    const [lng, lat] = result.center;
    setPosition([lat, lng]);
    setAddress(result.place_name);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (position) {
      onLocationSelect({
        latitude: position[0],
        longitude: position[1],
        address: address || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Pick Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{result.place_name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Address Display */}
          {address && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">Selected Location:</p>
                <p className="text-sm text-blue-700 mt-0.5 break-words">{address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={position ? 15 : 12}
            style={{ height: '100%', width: '100%' }}
            key={`${mapCenter[0]}-${mapCenter[1]}`}
          >
            <TileLayer
              attribution={getMapboxAttribution()}
              url={getMapboxTileUrl('streets-v12')}
              tileSize={512}
              zoomOffset={-1}
            />
            <LocationMarker
              position={position}
              setPosition={setPosition}
              setAddress={setAddress}
            />
          </MapContainer>

          {/* Instructions Overlay */}
          {!position && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Click on the map or search to select a location
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!position}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
