//// src/types/shared.ts
export interface Cafe {
    id: string;
    google_place_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number | null;
    is_open_now: boolean;
    has_wifi: boolean;
    
  }