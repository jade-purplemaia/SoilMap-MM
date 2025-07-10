// beginning map for soil interactive map

// create base map using esri satellite imagery
const map = L.map('map').setView([20.8247, -156.919409], 8);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// set ahupuaa and soil series as separate panes to set ahupuaa lines higher in z-axis so they always appear over soil polygons
map.createPane('ahupuaaPane');
map.getPane('ahupuaaPane').style.zIndex = 500;

map.createPane('seriesPane');
map.getPane('seriesPane').style.zIndex = 450;

const urlLanai = 'https://lepolad.github.io/interactive-soil-map/poly_files/lanai_soil_combined.json';
const urlOahu = 'https://lepolad.github.io/interactive-soil-map/poly_files/oahu_soil_combined.json';
const urlMolokai = 'https://lepolad.github.io/interactive-soil-map/poly_files/molokai_soil_combined.json';
const urlMaui = 'https://lepolad.github.io/interactive-soil-map/poly_files/maui_soil_combined.json';
const urlKauai = 'https://lepolad.github.io/interactive-soil-map/poly_files/kauai_soil_combined.json';
const urlHawaii = 'https://lepolad.github.io/interactive-soil-map/poly_files/hawaii_soil_combined.json';
const urlKahoolawe = 'https://lepolad.github.io/interactive-soil-map/poly_files/kahoolawe_soil_combined.json';

const groupProperty = 'order';

const groupedLayers = {};

// adding ahupuaa to the map
// uses data from here: https://geoportal.hawaii.gov/datasets/HiStateGIS::ahupuaa/about
addAhupuaa();

// adds soil polygon layers to the map, calling all the other functions below
addLayers(groupProperty);


//adding information
const soilInfo = {
  Inceptisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Found in semi arid environments (also humid), wide range of characteristics and can be found in different climates",
    moolelo: "N/A"
  },
  Oxisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Found in subtropical/tropical regions and is really weathered soil. It has a low natural fertility and has indistinct horizons",
    moolelo: "N/A"
  },
  Ultisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Soil is found in humid areas and is formed from weathering and leaching processes. It is acidic",
    moolelo: "N/A"
  },
  Mollisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Dark colored surface horizon, relatively high in content of organic matter, also rich and fertile. Good for crops",
    moolelo: "N/A"
  },
  Vertisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Has a high content of expanding clay minerals and has cracks that open and close periodically. Water is transmitted very slowly and undergoes very little leaching",
    moolelo: "N/A"
  },
  Entisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Shows little to no evidence of pedogenic horizon development and can be found in areas where erosion of deposition rates are faster than the rate of soil development. More mature soils and tend to have a more reddish color ",
    moolelo: "N/A"
  },
  Spodosols: {
    controller: "Controller Information - NEED TO GET",
    information: "Formed from weathering processes that strip organic water combined with aluminum from the surface layer",
    moolelo: "N/A"
  },
  Aridisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Dry/has low moisture content, commonly found in deserts. It’s too dry for most plants to grow without irrigation. Erosion is more common since it lacks vegetation and has limited organic matter",
    moolelo: "N/A"
  },
  Histosols: {
    controller: "Controller Information - NEED TO GET",
    information: "High content of organic matter and very little permafrost. Histosol soil is formed from the decomposed plant remains.",
    moolelo: "N/A"
  },
  Andisols: {
    controller: "Controller Information - NEED TO GET",
    information: "Has little crystalline and ordered structure, with a high water and nutrient holding capacity. Also formed from weathering processes. Derived from volcanic ash but are useful for crops",
    moolelo: "Considered sacred — born of Pele — Andisols connect directly to fire-born land creation."
  },
  Unclassified: {
    controller: "Controller Information",
    information: "Unclassified soils are not fully surveyed or categorized, often is urban land/lava flows.",
    moolelo: "N/A"
  }
};









// additions for HTML page (beta) - Jade
// Need to wait for page to load
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.info-button');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      const tab = document.getElementById(tabId);

      if (tab.classList.contains('open')) {
        tab.classList.remove('open');
      } else {
        tab.classList.add('open');
      }
    });
  });
});



// FUNCTION SECTION


// maps colors to soil orders to color them together
function getColor(order) {
    switch (order) {
        case 'Inceptisols': return 'blue';
        case 'Oxisols': return 'red';
        case 'Ultisols': return 'purple';
        case 'Mollisols': return '#E0218A';
        case 'Vertisols': return 'orange';
        case 'Entisols': return '#e0da21';
        case 'Spodosols': return 'cyan';
        case 'Aridisols': return 'brown';
        case 'Histosols': return 'greenyellow';
        case 'Andisols': return 'darkslateblue'
        case 'Undefined': return 'white';
        default: return 'white';
    }
}
;

// function for retrieve data and group polygons by a given property
async function getAndGroupData(url, property){

    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Stay all hammajang my dawg, ${response.status}`);
        }

        const data = await response.json();

        // looping through each polygon in the data and grouping by the given property (soil order or soil series)
        // feature here refers to individual polygons from the json data object
        data.features.forEach(feature => {
            const groupName = feature.properties[property];

            // make new group if no exist
            if(!groupedLayers[groupName]){
                groupedLayers[groupName] = L.featureGroup();
            }

            // turning each feature into a leaflet polygon so it can be added to the map
            if(typeof feature === 'object' && feature !== null && feature.type === 'Feature' && feature.geometry){
                try{
                    const polygon = L.geoJSON(feature,
                        {style: (feature) => {
                            try{
                                const prop = feature.properties[property];
                                return{
                                    fillColor: getColor(prop), // color the polygons by soil order or soil series
                                    color: getColor(prop),
                                    weight: 1,
                                    fillOpacity: 0.5
                                }
                            }
                            // polygons with errors shown in black to highlight them for us to fix
                            catch (error){
                                console.error('style function stay hammajang', error)
                                return{
                                    fillColor: 'black',
                                    color: 'black',
                                    weight: 1,
                                    fillOpacity: 1
                                }
                            }
                           
                           
                         },
                        pane: 'seriesPane'
                        }
                    )    
                //    make polygons display the property when clicked
                   polygon.bindPopup(feature.properties['series']);
                //    add individual polygon to group
                   polygon.addTo(groupedLayers[groupName]);
                }
                catch (error){
                    console.error('stay all jam up trying for make L.GeoJSON', error, feature);
                }
            }
            
        });

    }
    catch(error){
        console.error(`something stay more broken than your teeth on ${url}, error: `, error);    
    }
}

// adds the layers and layer groups to the map
// stuff comes all kapakahi if no more seperate async function with await for getAndGroupData
async function initializeLayers(url, property){
    await getAndGroupData(url, property);

    // adding layer groups to map
    for(const groupName in groupedLayers){
        groupedLayers[groupName].addTo(map);
    }
}

// adjusts layers on map based on layer selector
function handleLayerChange(event){
    const selectedGroup = event.target.value;

    // Clear map layers
    for (const groupName in groupedLayers) {
        map.removeLayer(groupedLayers[groupName]);
    }

    // Add only selected layer
    if (selectedGroup !== 'all' && groupedLayers[selectedGroup]) {
        groupedLayers[selectedGroup].addTo(map);
    } else {
        // Add all layers back in
        for (const groupName in groupedLayers) {
            groupedLayers[groupName].addTo(map);
        }
    }

    // DOM Elements
    const buttonContainer = document.getElementById('soil-series-buttons');
    const contentContainer = document.getElementById('soil-series-content');
    const defaultInfo = document.getElementById('default-info');

    // Reset UI
    buttonContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    // Handle custom soil-series content
    // if (selectedGroup !== 'all') {
    //     defaultInfo.style.display = 'none';

    //     const buttons = [
    //         {
    //             id: 'controller',
    //             label: 'Soil Series Controller',
    //             content: `Information about how <strong>${selectedGroup}</strong> functions as a soil controller.`
    //         },
    //         {
    //             id: 'information',
    //             label: 'Soil Series Information',
    //             content: `Scientific info about <strong>${selectedGroup}</strong>'s texture, formation, and classification.`
    //         },
    //         {
    //             id: 'moolelo',
    //             label: 'Moʻolelo',
    //             content: `Cultural and historical moʻolelo related to <strong>${selectedGroup}</strong>.`
    //         }
    //     ];
    
    const content = soilInfo[selectedGroup];

    if (content) {

      const buttons = [
        {
            id: 'controller',
            label: 'Soil Series Controller',
            content: `<strong>${selectedGroup}</strong>: ${content.controller}`
        },
        {
            id: 'information',
            label: 'Soil Series Information',
            content: `<strong>${selectedGroup}</strong>: ${content.information}`
        },
        {
            id: 'moolelo',
            label: 'Moʻolelo',
            content: `<strong>${selectedGroup}</strong>: ${content.moolelo}`
        }
      ];


        buttons.forEach(btn => {
            // Create the button
            const button = document.createElement('div');
            button.className = 'info-button';
            button.textContent = btn.label;

            // Create the content panel
            const contentBlock = document.createElement('div');
            contentBlock.className = 'tab-content';
            contentBlock.innerHTML = `
              <h4>${btn.label}</h4>
              <p>${btn.content}</p>
            `;

            // Toggle logic
            button.addEventListener('click', () => {
                const isOpen = contentBlock.classList.contains('open');
                document.querySelectorAll('#soil-series-content .tab-content').forEach(tab => {
                    tab.classList.remove('open');
                });
                if (!isOpen) {
                    contentBlock.classList.add('open');
                }
            });

            buttonContainer.appendChild(button);
            contentContainer.appendChild(contentBlock);
        });

    } else {
        defaultInfo.style.display = 'block';
    }
}

/* calls initializeLayers for each island and then adds the dropdown selector afterwards
I went make it this way so that the dropdown has all of the orders on it and doesn't add
any soil orders to it multiple times.
I also tried having it loop through a list of the urls but that went broke instantly
*/
async function addLayers(prop){
    await initializeLayers(urlLanai, prop);
    await initializeLayers(urlOahu, prop);
    await initializeLayers(urlMolokai, prop);
    await initializeLayers(urlMaui, prop);
    await initializeLayers(urlKauai, prop);
    await initializeLayers(urlHawaii, prop);
    await initializeLayers(urlKahoolawe, prop);


    // adding layer control to dropdown located off of the map
    const dropdown = document.getElementById('dropdown');
    for(const groupName in groupedLayers){
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        dropdown.appendChild(option);  
    }

    dropdown.addEventListener('change', handleLayerChange);
}


// adds ahupuaa layer to map, sets them on upper pane and non-interactive so they no interfere with soil series polygons
async function addAhupuaa(){
    const url = 'https://geodata.hawaii.gov/arcgis/rest/services/HistoricCultural/MapServer/1/query?outFields=*&where=1%3D1&f=geojson'

    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Ahupuaa stay buss up, something wrong ${response.status}`);
        }

        const data = await response.json();
        
        data.features.forEach(feature => {
             // turning each feature into a leaflet polygon so it can be added to the map
            if(typeof feature === 'object' && feature !== null && feature.type === 'Feature' && feature.geometry){
                try{
                    const polygon = L.geoJSON(feature,
                        {
                            style: {'color': "black", 'weight': 1, 'fill':false},
                            pane: 'ahupuaaPane',
                            interactive:false
                        }
                    )
                    polygon.addTo(map);
                }
                catch(error){
                    console.error('Brah your ahupuaa polygons stay messed up', error);
                }
            }
        })
    }
    catch(error){
        console.error('You gotta get it together brah', error);
    }
}
