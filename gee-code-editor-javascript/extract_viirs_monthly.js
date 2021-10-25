// =============================================================
// Extract VIIRS Monthly Data to Country
// =============================================================

// DESCRIPTION:
// Extracts monthly VIIRS data using two version of the VIIRS dataset:
//
// (1) VIIRS Nighttime Day/Night Band Composites Version 1
//     https://developers.google.com/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_MONTHLY_V1_VCMCFG
//     
//     This dataset starts in April, 2012. Processing has been
//     done to address stray light, lightning, lunar illumination,
//     and cloud-cover.
//
//     The name of the .tif files produced from this dataset will contain:
//     _viirs_raw_monthly_start_201204_
//
// (2) VIIRS Stray Light Corrected Nighttime Day/Night Band Composites Version 1
//     https://developers.google.com/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_MONTHLY_V1_VCMSLCFG
//
//     This dataset starts in January, 2014. Additional processing
//     has been done to account for stray light.
//
//     The name of the .tif files produced from this dataset will contain:
//     _viirs_corrected_monthly_start_201401
//
// For each dataset, two .tif files are created. The first
// .tif file contains average monthly radiance (avg_rad) for 
// each month and the second contains the number of cloud free 
// observations (cf_cvg) for each month. Each raster contains 
// a band for each month (the first band is the first month, etc.)

// INSTRUCTIONS:
// 1. Change the below parameters to the country of interest
//    and to an existing google drive folder.
// 2. Click "Run" (top right corner)
// 3. Under "Tasks" (tab in top right corner), click "Run"
//    for each data file.

// PARAMETERS:
// Name of country where data should be extracted
var COUNTRY_NAME = 'Ethiopia';

// Name of existing folder in google drive where 
// data should be outputted
var GDRIVE_FOLDER = 'gee_extracts';

// Extract VIIRS Function ======================================
var extract_viirs_monthly = function(country_name, 
                                     begin_date, 
                                     end_date, 
                                     raw_or_corrected_viirs, 
                                     gdrive_folder, 
                                     image_name){
  
  // Get country feature
  var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
  var country = countries.filter(ee.Filter.eq('country_na', country_name));
  
  // Load VIIRS
  if(raw_or_corrected_viirs == "raw"){
    var viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG'); // Raw: Starts 2012-04
  }
  
  if(raw_or_corrected_viirs == "corrected"){
    var viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG'); // Corrected: Starts 2012-04
  }
  
  // Filter Dates
  viirs = ee.ImageCollection(
    viirs.filterDate(begin_date,end_date)
  );
  
  // Create separate ImageCollections of radiance and cloud cover
  var viirs_avg_rad = viirs.select('avg_rad');
  var viirs_cf_cvg = viirs.select('cf_cvg');
  
  // Function to turn imagecollection into image with bands
  var stackCollection = function(collection) {
    // Create an initial image.
    var first = ee.Image(collection.first()).select([]);
  
    // Write a function that appends a band to an image.
    var appendBands = function(image, previous) {
      return ee.Image(previous).addBands(image);
    };
    return ee.Image(collection.iterate(appendBands, first));
  };
  
  var viirs_avg_rad_image = stackCollection(viirs_avg_rad);
  var viirs_cf_cvg_image = stackCollection(viirs_cf_cvg);
  
  // Make sure data types are all the same 
  viirs_avg_rad_image = viirs_avg_rad_image.float()
  viirs_cf_cvg_image = viirs_cf_cvg_image.int16()

  var avg_rad_name = image_name + "_avg_rad"
  var cf_cvg_name = image_name + "_cf_cvg"
  
  Export.image.toDrive({
    folder: gdrive_folder,
    image: viirs_avg_rad_image,
    scale: 500,
    region: country.geometry().bounds(),
    description: avg_rad_name,
  });
  
  Export.image.toDrive({
    folder: gdrive_folder,
    image: viirs_cf_cvg_image,
    scale: 500,
    region: country.geometry().bounds(),
    description: cf_cvg_name,
  });
  
    return viirs_avg_rad_image;
  
};

// Extract VIIRS ============================================================================
var viirs_raw = extract_viirs_monthly(COUNTRY_NAME, 
                                      '2012-04-01', 
                                      '2022-01-31', 
                                      'raw',       
                                      'india_ntl_viirs_monthly', 
                                       COUNTRY_NAME + '_viirs_raw_monthly_start_201204');
var viirs_corrected = extract_viirs_monthly(COUNTRY_NAME, 
                                            '2014-01-01', 
                                            '2022-01-31', 
                                            'corrected', 
                                            'india_ntl_viirs_monthly', 
                                            COUNTRY_NAME + '_viirs_corrected_monthly_start_201401');

Map.addLayer(viirs_raw, {}, 'VIIRS');



