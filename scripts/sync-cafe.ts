import 'dotenv/config';
import { GooglePlacesService } from '../lib/google-places';
import { supabase } from '../lib/supabase';

async function syncCafes() {
  console.log('🔄 Starting cafe sync from Google Places...');
  
  try {
    // Initialize service
    const googlePlaces = new GooglePlacesService();
    
    // Fetch cafes from Google Places
    console.log('📡 Fetching cafes from Google Places API...');
    const cafes = await googlePlaces.searchWaterlooCafes();
    
    console.log(`📍 Found ${cafes.length} cafes in Waterloo region`);
    
    // Sync to database
    let successCount = 0;
    let errorCount = 0;
    
    for (const cafe of cafes) {
      try {
        const { error } = await supabase
          .from('cafes')
          .upsert(cafe, { 
            onConflict: 'google_place_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(` Error syncing ${cafe.name}:`, error.message);
          errorCount++;
        } else {
          console.log(` Synced: ${cafe.name}`);
          successCount++;
        }
      } catch (err) {
        console.error(` Failed to sync ${cafe.name}:`, err);
        errorCount++;
      }
    }
    
    console.log('\n Sync Summary:');
    console.log(`Success: ${successCount} cafes`);
    console.log(`Errors: ${errorCount} cafes`);
    console.log(`Sync completed!`);

  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncCafes();