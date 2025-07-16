// Check if script is loaded
console.log('Script loaded successfully');

// Constants and configuration
const mapConfig = {
    center: [20.8247, -156.919409],
    zoom: 8,
    tileLayer: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
};

// URL constants for GeoJSON files
const islandUrls = {
    lanai: '/geojson/lanai_soil_combined.json',
    oahu: '/geojson/oahu_soil_combined.json',
    molokai: '/geojson/molokai_soil_combined.json',
    maui: '/geojson/maui_soil_combined.json',
    kauai: '/geojson/kauai_soil_combined.json',
    hawaii: '/geojson/hawaii_soil_combined.json',
    kahoolawe: '/geojson/kahoolawe_soil_combined.json'
};

// Soil type definitions
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
        controller: "Controller Information",
        information: "Has little crystalline and ordered structure, with a high water and nutrient holding capacity. Also formed from weathering processes. Derived from volcanic ash but are useful for crops",
        moolelo: "Considered sacred — born of Pele — Andisols connect directly to fire-born land creation."
    },
    Unclassified: {
        controller: "Controller Information",
        information: "Unclassified soils are not fully surveyed or categorized, often is urban land/lava flows.",
        moolelo: "N/A"
    }
};

console.log('Soil Info object:', soilInfo);
console.log('Available soil types:', Object.keys(soilInfo));

// Global variables
const groupProperty = 'order';
let map; // Declare map as global variable
const groupedLayers = {};

// Function to initialize map and populate dropdown
async function initializeMapAndDropdown() {
    console.log('Starting map and dropdown initialization');

    try {
        // Verify sidebar exists
        const sidebar = document.querySelector('#sidebar');
        if (!sidebar) {
            console.error('Critical error: Sidebar element not found in DOM');
            return;
        }
        console.log('Sidebar found in DOM');

        // Create map
        map = L.map('map').setView(mapConfig.center, mapConfig.zoom);
        L.tileLayer(mapConfig.tileLayer, { attribution: mapConfig.attribution }).addTo(map);
        console.log('Map created and base layer added');

        // Set up panes
        map.createPane('ahupuaaPane');
        map.getPane('ahupuaaPane').style.zIndex = 500;
        map.createPane('seriesPane');
        map.getPane('seriesPane').style.zIndex = 450;
        console.log('Map panes created');

        // Initialize soil layers for all islands
        for (const island in islandUrls) {
            console.log(`Loading data for ${island}`);
            await initializeLayers(islandUrls[island], groupProperty);
        }
        console.log('All island layers loaded');

        // Add ahupuaa layer
        await addAhupuaa();
        console.log('Ahupuaa layer added');

        // Populate dropdown
        const dropdown = document.getElementById('soil-type');
        if (!dropdown) {
            console.error('Critical error: Dropdown element not found in DOM');
            return;
        }
        console.log('Found dropdown element, starting to populate');

        // Clear existing options
        dropdown.innerHTML = ''; // Clear all options

        // Add "All" option
        const firstOption = document.createElement('option');
        firstOption.value = 'all';
        firstOption.textContent = 'Show All Layers';
        firstOption.selected = true;
        dropdown.appendChild(firstOption);
        console.log('Added "All" option to dropdown');

        // Add soil types from soilInfo
        const soilTypes = Object.keys(soilInfo).sort();
        console.log('Available soil types in soilInfo:', soilTypes);
        
        // Add options directly
        soilTypes.forEach(soilType => {
            dropdown.innerHTML += `<option value="${soilType}">${soilType}</option>`;
            console.log(`Added soil type to dropdown: ${soilType}`);
        });

        // Add event listener
        dropdown.addEventListener('change', handleLayerChange);
        console.log('Dropdown event listener added');

        // Verify options were added
        const options = dropdown.querySelectorAll('option');
        console.log('Final number of options:', options.length);
        options.forEach(opt => {
            console.log(`Option value: ${opt.value}, text: ${opt.textContent}`);
        });

        console.log('Map and dropdown initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        throw error;
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event triggered');
    initializeMapAndDropdown();
});

// Function to get color for soil orders
function getColor(order) {
    const colors = {
        Inceptisols: 'blue',
        Oxisols: 'red',
        Ultisols: 'purple',
        Mollisols: '#E0218A',
        Vertisols: 'orange',
        Entisols: '#e0da21',
        Spodosols: 'cyan',
        Aridisols: 'brown',
        Histosols: 'greenyellow',
        Andisols: 'darkslateblue',
        Undefined: 'white'
    };
    return colors[order] || 'white';
}

// Function for retrieving and grouping data
async function getAndGroupData(url, property) {
    try {
        console.log(`Loading data from ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error loading ${url}: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Loaded ${data.features.length} features`);

        const foundSoilTypes = new Set();
        const invalidFeatures = [];

        data.features.forEach(feature => {
            const groupName = feature.properties[property];
            if (groupName) {
                foundSoilTypes.add(groupName);
            } else {
                invalidFeatures.push(feature.properties);
            }

            if (!groupedLayers[groupName]) {
                groupedLayers[groupName] = L.featureGroup();
            }

            if (feature.type === 'Feature' && feature.geometry) {
                try {
                    const polygon = L.geoJSON(feature, {
                        style: feature => ({
                            fillColor: getColor(feature.properties[property]),
                            color: getColor(feature.properties[property]),
                            weight: 1,
                            fillOpacity: 0.5
                        }),
                        pane: 'seriesPane'
                    });
                    polygon.bindPopup(feature.properties['series']);
                    polygon.addTo(groupedLayers[groupName]);
                } catch (error) {
                    console.error('Error creating polygon:', error);
                    invalidFeatures.push(feature.properties);
                }
            }
        });

        console.log(`Found ${foundSoilTypes.size} unique soil types`);
        if (invalidFeatures.length > 0) {
            console.warn(`Found ${invalidFeatures.length} invalid features`);
        }

    } catch (error) {
        console.error('Error processing data:', error);
        throw error;
    }
}

// Function to initialize layers
async function initializeLayers(url, property) {
    await getAndGroupData(url, property);
    for (const groupName in groupedLayers) {
        groupedLayers[groupName].addTo(map);
    }
}

// Function to handle layer changes
function handleLayerChange(event) {
    console.log('Dropdown change event triggered');
    const selectedGroup = event.target.value;
    
    // Toggle layers
    for (const groupName in groupedLayers) {
        map.removeLayer(groupedLayers[groupName]);
    }
    
    if (selectedGroup !== 'all' && groupedLayers[selectedGroup]) {
        groupedLayers[selectedGroup].addTo(map);
    } else {
        for (const groupName in groupedLayers) {
            groupedLayers[groupName].addTo(map);
        }
    }

    // Update UI
    const buttonContainer = document.getElementById('soil-series-buttons');
    const contentContainer = document.getElementById('soil-series-content');
    const defaultInfo = document.getElementById('default-info');

    buttonContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    const content = soilInfo[selectedGroup];
    if (content) {
        defaultInfo.style.display = 'none';
        const buttons = [
            { id: 'controller', label: 'Soil Series Controller', content: content.controller },
            { id: 'information', label: 'Soil Series Information', content: content.information },
            { id: 'moolelo', label: 'Moʻolelo', content: content.moolelo }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('div');
            button.className = 'info-button';
            button.textContent = btn.label;

            const contentBlock = document.createElement('div');
            contentBlock.className = 'tab-content';
            contentBlock.innerHTML = `
                <h4>${btn.label}</h4>
                <p><strong>${selectedGroup}</strong>: ${btn.content}</p>
            `;

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

// Function to add ahupuaa layer
async function addAhupuaa() {
    try {
        const url = 'https://geodata.hawaii.gov/arcgis/rest/services/HistoricCultural/MapServer/1/query?outFields=*&where=1%3D1&f=geojson';
        const response = await fetch(url);
        const data = await response.json();
        
        const ahupuaaLayer = L.geoJSON(data, {
            style: { color: 'black', weight: 2 },
            pane: 'ahupuaaPane'
        });
        
        ahupuaaLayer.addTo(map);
    } catch (error) {
        console.error('Error adding ahupuaa layer:', error);
    }
}
