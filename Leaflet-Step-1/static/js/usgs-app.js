// USGS data
const url_USGS_Magnitude_1_0_plus_Earthquakes_Past_Month = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_month.geojson';

// Creating map object
const usgsMap = L.map(
    "earthquakes-map-id",
    {
        center: [40, -98],
        zoom: 5
    }
);

// Create the tile layer that will be the background of our map
L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        id: "dark-v10",
        accessToken: API_KEY
    }
).addTo(usgsMap);

const LESS_OR_EQUAL_TO_250 = "#FFFFFF";
const LESS_OR_EQUAL_TO_500 = "#FFD0D0";
const LESS_OR_EQUAL_TO_750 = "#FFA1A1";
const LESS_OR_EQUAL_TO_1000 = "#FF7272";
const MORE_THAN_1000 = "#FF4444";

// Get the color based on the significance
function getColor(significance) {
    return significance <= 250 ? LESS_OR_EQUAL_TO_250 :
        significance <= 500 ? LESS_OR_EQUAL_TO_500 :
            significance <= 750 ? LESS_OR_EQUAL_TO_750 :
                significance <= 1000 ? LESS_OR_EQUAL_TO_1000 : MORE_THAN_1000;
}

// Generate the legend to describe the significance
function addLegend() {
    const legend = L.control(
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

d3.json(
    url_USGS_Magnitude_1_0_plus_Earthquakes_Past_Month,
    earthquakesData => {
        earthquakesData.features.forEach(
            earthquakeData => {
                
                const latitude = earthquakeData.geometry.coordinates[1];
                const longitude = earthquakeData.geometry.coordinates[0];
                const earthquake_magnitude = earthquakeData.properties.mag;
                const earthquake_significance = earthquakeData.properties.sig;
                const place = earthquakeData.properties.place;
                
                const time_as_long = earthquakeData.properties.time;
                const time = new Date(time_as_long);
                
                const circleColor = getColor(earthquake_significance);
                let circleMarker = L.circle(
                    [latitude, longitude],
                    {
                        color: circleColor,
                        stroke: false,
                        //fillColor: circleColor,
                        //fill: true,
                        fillOpacity: 0.35,
                        radius: earthquake_magnitude * 10000
                    }
                );
                
                circleMarker.bindPopup(
                    "<h3>" + place + "</h3>" +
                    "<hr> <Strong>Date and Time</Strong>: " + time.toString() +
                    "<hr> <strong>Magnitude</strong>: " + earthquake_magnitude +
                    "<hr> <strong>Significance</strong>: " + earthquake_significance);
                circleMarker.addTo(usgsMap);
            }
        );
        
        addLegend();
    }
);