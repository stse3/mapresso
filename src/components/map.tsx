import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export function Map() {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainer.current) {
            console.error('Map container not found');
            return;
        }

        try {
            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-80.5448, 43.4723],
                zoom: 15
            });

            map.on('load', () => {
            });

            map.on('error', (e: { error: Error }) => {
                console.error('Mapbox error:', e);
            });

            return () => map.remove();
        } catch (error) {
            console.error('Error creating map:', error);
        }
    }, []);

    return (
        <div 
            ref={mapContainer}
            style={{ 
                width: '100%', 
                height: '100vh',
                position: 'absolute',
                top: 0,
                left: 0,
                background: '#f0f0f0',
                border: '2px solid red'
            }}
        />
    );
}