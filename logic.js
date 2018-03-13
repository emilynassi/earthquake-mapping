// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

var boundaries = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});



function markerSize(mag) {
    return mag * 7;
  }

function colors(mag) {
    return mag > 5 ? '#d53e4f' :
           mag > 4  ? '#fc8d59' :
           mag > 3  ? '#fee08b' :
           mag > 2  ? '#e6f598' :
           mag > 1   ? '#99d594' :
                      '#4575b4';
}
  

function createFeatures(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
 
  
  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: function onEachFeature(feature, layer) {
      layer.bindPopup("<h3>" +"Maginitude: " + feature.properties.mag +
        "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  },
  pointToLayer: function (feature, latlng) {
    return new L.CircleMarker(latlng, {
        radius: markerSize(feature.properties.mag),
        fillColor: colors(feature.properties.mag),
        color: colors(feature.properties.mag),
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
        clickable: true
    })
  }
});

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
};

function createMap(earthquakes) {

  // Define plainmap and satellite layers
  var plainmap = L.tileLayer("https://api.mapbox.com/styles/v1/enassi/cjeojkdsr6ghf2sp346vuxyl9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZW5hc3NpIiwiYSI6ImNqZWo2YXk2bDJwbnozOW83Y3A2bTUxYmkifQ.RFMxc-rS7DhCPJvlaTQUTA");

  var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/enassi/cjepoda1b7dqf2ro2w1ot88x1/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZW5hc3NpIiwiYSI6ImNqZWo2YXk2bDJwbnozOW83Y3A2bTUxYmkifQ.RFMxc-rS7DhCPJvlaTQUTA");

  var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/enassi/cjelhzzdq69w32rqctl5rc3u2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZW5hc3NpIiwiYSI6ImNqZWo2YXk2bDJwbnozOW83Y3A2bTUxYmkifQ.RFMxc-rS7DhCPJvlaTQUTA");

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Basic Map": plainmap,
    "Street Map": streetmap,
    "Satellite": satellite,};

  //Add new layer for techtonic plates
  var faultLines = new L.LayerGroup();

//Add new layer for timeline
var timeLineLayer = new L.LayerGroup();

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    "Fault Lines": faultLines,
    "Time Line": timeLineLayer,
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [plainmap, earthquakes, faultLines, timeLineLayer]
  });


  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
  var legend = L.control({position: 'bottomright'});

legend.onAdd = function (myMap) {

    var div = L.DomUtil.create('div', 'info legend'),
        mag = [0,1,2,3,4,5]
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < mag.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors(mag[i] + 1) + '"></i> ' +
            mag[i] + (mag[i + 1] ? '&ndash;' + mag[i + 1] + '<br>' : '+');
    }

    return div;
};
legend.addTo(myMap);

//Read in fault data and add to faultLines layer

d3.json(boundaries, function(data) {
  // Adding our geoJSON data, along with style information, to the tectonicplates
  // layer.
  L.geoJson(data, {
    color: "orange",
    weight: 2
  })
  .addTo(faultLines);
});

d3.json(queryUrl, function(data) {
  var getInterval = function(quake) {
    // earthquake data only has a time, so we'll use that as a "start"
    // and the "end" will be that + some value based on magnitude
    // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
    // map for 150 minutes or 2.5 hours
    return {
      start: quake.properties.time,
      end:   quake.properties.time + quake.properties.mag * 1800000
    };
  };
  var timelineControl = L.timelineSliderControl({
    formatOutput: function(date) {
      return new Date(date).toString();
    }
  });
  var timeline = L.timeline(data, {
    getInterval: getInterval,
    pointToLayer: function(data, latlng){
      var hue_min = 120;
      var hue_max = 0;
      var hue = data.properties.mag / 10 * (hue_max - hue_min) + hue_min;
      return L.circleMarker(latlng, {
        radius: data.properties.mag * 3,
        color: "hsl("+hue+", 100%, 50%)",
        fillColor: "hsl("+hue+", 100%, 50%)"
      }).bindPopup('<a href="'+data.properties.url+'">click for more info</a>');
    }
  });
  timelineControl.addTo(myMap);
  timelineControl.addTimelines(timeline);
  timeline.addTo(myMap);
});
}
