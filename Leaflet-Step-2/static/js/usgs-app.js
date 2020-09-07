const LESS_OR_EQUAL_TO_250 = "#FFBFBF";
const LESS_OR_EQUAL_TO_500 = "#FF9F9F";
const LESS_OR_EQUAL_TO_750 = "#FF7F7F";
const LESS_OR_EQUAL_TO_1000 = "#FF5F5F";
const MORE_THAN_1000 = "#FF3F3F";

// Get the color based on the significance
function getColorFromSig(significance) {
    return significance <= 250 ? LESS_OR_EQUAL_TO_250 :
        significance <= 500 ? LESS_OR_EQUAL_TO_500 :
            significance <= 750 ? LESS_OR_EQUAL_TO_750 :
                significance <= 1000 ? LESS_OR_EQUAL_TO_1000 : MORE_THAN_1000;
}

function getWeight(allProperties) {
    if (allProperties) {
        return allProperties.properties.slip_rate.includes("Greater than 5.0 mm") ? 2.5 : 1
    }
    
    return 0;
}

// Generate the legend to describe the significance
function addLegendToMap() {
    const legend = L.control (
        {
            position: 'bottomright'
        }
    );
    
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const keys = ["0 - 250", "250 - 500", "500 - 750", "750 - 1000", "1000+"];
        const colors = [
            LESS_OR_EQUAL_TO_250,
            LESS_OR_EQUAL_TO_500,
            LESS_OR_EQUAL_TO_750,
            LESS_OR_EQUAL_TO_1000,
            MORE_THAN_1000
        ];
        
        // loop through intervals and generate a label with a colored square for each interval
        for (let i = 0; i < keys.length; i++) {
            div.innerHTML += '<i style="background:' + colors[i] + '"></i> ' + keys[i] + '<br>';
        }
        
        return div;
    };
    
    legend.addTo(usgsMap);
}

// USGS data
const url_USGS_Magnitude_1_0_plus_Earthquakes_Past_Month = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_month.geojson';

// Create the tile layer that will be the background of our map
const darkMap = L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        id: "dark-v10",
        accessToken: API_KEY
    }
);

const lightMap = L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        id: "light-v10",
        accessToken: API_KEY
    }
);

const baseMaps = {
    "Dark Map": darkMap,
    "Light Map": lightMap,
};

const layers = {
    earthquakes: new L.LayerGroup(),
    faults: new L.LayerGroup()
};

const overlays = {
    "Earthquakes": layers.earthquakes,
    "Faults": layers.faults
};

// Creating map object
const usgsMap = L.map(
    "earthquakes-map-id",
    {
        center: [40, -98],
        zoom: 5,
        layers: [
            layers.earthquakes,
            layers.faults
        ]
    }
);

L.control.layers(
    baseMaps,
    overlays,
    {
        collapsed: false
    }
).addTo(usgsMap);

darkMap.addTo(usgsMap);

d3.json(url_USGS_Magnitude_1_0_plus_Earthquakes_Past_Month).then(
    earthquakesData => {
        d3.json("static/data/qfaults_latest_quaternary.geojson").then(
            data => {
                earthquakesData.features.forEach(
                    earthquakeData => {
                        
                        const latitude = earthquakeData.geometry.coordinates[1];
                        const longitude = earthquakeData.geometry.coordinates[0];
                        const earthquake_magnitude = earthquakeData.properties.mag;
                        const earthquake_significance = earthquakeData.properties.sig;
                        const place = earthquakeData.properties.place;
                        
                        const time_as_long = earthquakeData.properties.time;
                        const time = new Date(time_as_long);
                        
                        const circleColor = getColorFromSig(earthquake_significance);
                        let circleMarker = L.circle(
                            [latitude, longitude],
                            {
                                color: circleColor,
                                stroke: false,
                                fillOpacity: 0.35,
                                radius: earthquake_magnitude * 10000
                            }
                        );
                        
                        circleMarker.bindPopup(
                            "<h3>" + place + "</h3>" +
                            "<hr> <Strong>Date and Time</Strong>: " + time.toString() +
                            "<hr> <strong>Magnitude</strong>: " + earthquake_magnitude +
                            "<hr> <strong>Significance</strong>: " + earthquake_significance);
                        circleMarker.addTo(layers.earthquakes);
                    }
                );
                
                L.geoJSON(
                    data, {
                        style: function (feature) {
                            return {
                                color: "#ffa500",
                                fillOpacity: 0.5,
                                weight: getWeight(feature)
                            };
                        },
                        filter: function (feature) {
                            if (feature.properties.slip_rate && (feature.properties.slip_rate.includes("Greater than 5.0 mm") || feature.properties.slip_rate.includes("Between 1.0 and 5.0 mm"))) {
                                return true;
                            }
                        },
                        onEachFeature: function (feature, layer) {
                            layer.bindPopup(
                                "<strong>Fault:</strong> " + feature.properties.fault_name +
                                "<br><strong>Slip Rate:</strong> " + feature.properties.slip_rate);
                        }
                    }
                ).addTo(layers.faults);
            }
        );
        
        addLegendToMap();
    }
);