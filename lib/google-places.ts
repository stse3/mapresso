const GOOGLE_PLACES_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY;

export const kitchenerWaterlooBounds = {
  north: 43.5200,   // North edge of Waterloo
  south: 43.4000,   // South edge of Kitchener
  east: -80.4200,   // East edge covering both cities
  west: -80.6000    // West edge covering both cities
};

// Kitchener-Waterloo center point (between both cities)
export const KW_CENTER = {
  latitude: 43.4600,  // Centered between Kitchener and Waterloo
  longitude: -80.5100
};
interface Bounds {
    south: number;
    north: number;
    west: number;
    east: number;
  }
  
  interface SearchArea {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  }

export const searchTypes = ['cafe', 'coffee_shop'];

// Chain restaurants/cafes to filter out
const CHAIN_FILTERS = [
  'tim hortons',
  'tims',
  'mcdonalds',
  'mcdonald\'s',
  'coffee time',
  'country style',
  'dunkin',
  'subway',
  'baskin-robbins',
  'fit for life'
];

export function mapPriceLevel(priceLevel: string): number | null {
  const mapping = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4
  };
  return mapping[priceLevel] || null;
}

// Filter out chain restaurants
function isChainRestaurant(placeName: string): boolean {
  const nameLower = placeName.toLowerCase();
  return CHAIN_FILTERS.some(chain => nameLower.includes(chain));
}

export const transformPlaceData = (place: any) => {
  return {
    google_place_id: place.id,
    name: place.displayName?.text || 'Unknown Cafe',
    address: place.formattedAddress || '',
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    
    // Hours
    is_open_now: place.regularOpeningHours?.openNow || false,
    opening_hours: place.regularOpeningHours?.weekdayDescriptions || null,
    
    // Rating
    rating: place.rating || null,
    user_rating_count: place.userRatingCount || 0,
    
    // Amenities
    price_level: mapPriceLevel(place.priceLevel),
    
    // Contact
    phone_number: place.nationalPhoneNumber || null,
    website: place.websiteUri || null,
    
    // Metadata
    last_updated: new Date().toISOString()
  };
};

export class GooglePlacesService {
  // Helper method to create multiple search areas to cover the entire bounds
  createSearchAreas(): SearchArea[] {
    const bounds = kitchenerWaterlooBounds;
    const areas = [] as SearchArea[];
  
    const radius = 3000;
    const latStep = 0.027;
    const lngStep = 0.036;
  
    for (let lat = bounds.south; lat <= bounds.north + 1e-6; lat += latStep) {
      for (let lng = bounds.west; lng <= bounds.east + 1e-6; lng += lngStep) {
        areas.push({
          center: { latitude: lat, longitude: lng },
          radius: radius
        });
      }
    }
  
    console.log(`🗺️ Created ${areas.length} search areas covering lat: ${bounds.south} to ${bounds.north}, lng: ${bounds.west} to ${bounds.east}`);
    return areas;
  }
  

  async searchSingleArea(center: {latitude: number, longitude: number}, radius: number) {
    const requestBody = {
      includedTypes: ['cafe', 'coffee_shop'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: center,
          radius: radius
        }
      }
    };

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.regularOpeningHours',
      'places.priceLevel',
      'places.nationalPhoneNumber',
      'places.websiteUri',
    ].join(',');

    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.places || [];
  }

  async searchWaterlooCafes() {
    console.log('🔑 Using API Key:', GOOGLE_PLACES_API_KEY ? 'Present' : 'Missing');
    
    const searchAreas = this.createSearchAreas();
    console.log(`📍 Searching ${searchAreas.length} areas to cover entire Kitchener-Waterloo bounds`);
    
    const allPlaces = new Map(); // Use Map to deduplicate by place ID
    
    // Search each area
    for (let i = 0; i < searchAreas.length; i++) {
      const area = searchAreas[i];
      console.log(`🔍 Searching area ${i + 1}/${searchAreas.length} at ${area.center.latitude.toFixed(4)}, ${area.center.longitude.toFixed(4)}`);
      
      try {
        const places = await this.searchSingleArea(area.center, area.radius);
        
        // Add places to our map (automatically deduplicates)
        places.forEach(place => {
          // Filter out chains before adding
          const placeName = place.displayName?.text || '';
          if (!isChainRestaurant(placeName)) {
            allPlaces.set(place.id, place);
          } else {
            console.log(`🚫 Filtered out chain: ${placeName}`);
          }
        });
        
        console.log(`✅ Area ${i + 1}: Found ${places.length} places, filtered to ${places.filter(p => !isChainRestaurant(p.displayName?.text || '')).length} independent cafes`);
        
        // Add small delay to avoid rate limiting
        if (i < searchAreas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error searching area ${i + 1}:`, error);
        // Continue with other areas
      }
    }
    
    const uniquePlaces = Array.from(allPlaces.values());
    console.log(`🎯 Total unique independent cafes found: ${uniquePlaces.length}`);
    
    // Transform and return the data
    return uniquePlaces.map(transformPlaceData);
  }
}