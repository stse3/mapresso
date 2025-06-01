import { supabase } from '../../lib/supabase.ts';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Point } from 'geojson';

const UWATERLOO_COORDS: [number, number] = [-80.5448, 43.4723];

export async function displayMapWithSupabaseData(containerId: string) {
    console.log('Initializing map with container:', containerId);
    
    if (!mapboxgl.accessToken) {
        throw new Error('Mapbox token is not set');
    }

    const map = new mapboxgl.Map({
        container: containerId,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: UWATERLOO_COORDS,
        zoom: 15
    });

    map.on('load', async () => {
        console.log('Map loaded, fetching data from Supabase');
        try {
            const { data: locations, error } = await supabase
                .from('cafes')
                .select('id, name, latitude, longitude');

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (!locations || locations.length === 0) {
                console.log('No locations found in database');
                return;
            }

            console.log(`Found ${locations.length} locations`);

            const geoJson: FeatureCollection<Point> = {
                type: 'FeatureCollection',
                features: locations.map(location => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [location.longitude, location.latitude]
                    },
                    properties: {
                        id: location.id,
                        name: location.name
                    }
                }))
            };

            map.addSource('supabase-locations', {
                type: 'geojson',
                data: geoJson
            });
            
            map.addLayer({
                id: 'unclustered-points',
                type: 'circle',
                source: 'supabase-locations',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#3b82f6',
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                }
            });

            console.log('Map data loaded successfully');

        } catch (error) {
            console.error("Error loading map data:", error);
        }
    });

    map.on('error', (e: Error) => {
        console.error('Mapbox error:', e);
    });
}