


var mapData = {};       // Global variable for GeoJSON map data
var countryData = {};   // global variable for country malaria info
var africa = [];        // global variable for restructured data
var mapFilter = "UN_population";
var colorScheme;        // colorbrewer theme
var colorSchemeSteps = 7;


var mapWidth = 850,
    mapHeight = 750;


var legendWidth = 300,
    legendHeight = 300;


var mapSvg = d3.select("#map-area").append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

var projection = d3.geo.mercator()
    .translate([mapWidth/3, mapHeight/2])
    .scale([500]);

var path = d3.geo.path()
    .projection(projection);

var legendSvg = d3.select("#legend-area").append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);


// define choropleth scale
updateColorScheme();
var color = d3.scale.quantize()
        .range(colorScheme);


/* define tooltip */
var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {

        // create object to add bold style for only selected map data values
        var boldOn = {
            UN_population: "",
            At_risk: "",
            At_high_risk: "",
            Malaria_cases: "",
            Suspected_malaria_cases: ""
        };

        var boldOff = {
            UN_population: "",
            At_risk: "",
            At_high_risk: "",
            Malaria_cases: "",
            Suspected_malaria_cases: ""
        };

        boldOn[mapFilter] = "<strong>";
        boldOff[mapFilter] = "</strong>";

        // build string with tool tip data
        var tip = "<span class='tip-country'>" + d.Country + "</span>";

        // include only valid data.
        // write each stat to new line, use bullet icons (TO DO --- change color to match scale value --)
        // bold line that matches filter, format number values as needed

        if ((d.properties.subregion != null) && (d.properties.subregion != "")) {
            tip += "</br> <strong><em>" + d.properties.subregion + "</em></strong></span>";
        }
        if ((d.UN_population != null) && (d.UN_population != "")) {
            tip += "</br>" + boldOn.UN_population + "<span class='fa fa-circle'></span>" + getFilterTitle("UN_population") + ":  " + d3.format(",")(d.UN_population) + boldOff.UN_population;
        }
        if ((d.Malaria_cases != null) && (d.Malaria_cases != "")) {
            tip += "</br>" + boldOn.Malaria_cases + "<span class='fa fa-circle'></span>" + getFilterTitle("Malaria_cases") + ":  "  + d3.format(",")(d.Malaria_cases) + boldOff.Malaria_cases;
        }
        if ((d.Suspected_malaria_cases != null) && (d.Suspected_malaria_cases != "")) {
            tip += "</br>" + boldOn.Suspected_malaria_cases + "<span class='fa fa-circle'></span>" + getFilterTitle("Suspected_malaria_cases") + ":  "  + d3.format(",")(d.Suspected_malaria_cases) + boldOff.Suspected_malaria_cases;
        }
        if ((d.At_risk != null) && (d.At_risk != "")) {
            tip += "</br>" + boldOn.At_risk + "<span class='fa fa-circle'></span>" + getFilterTitle("At_risk") + ":  "  + d.At_risk + "%"  + boldOff.At_risk;
        }
        if ((d.At_high_risk != null) && (d.At_high_risk != "")) {
            tip += "</br>" + boldOn.At_high_risk + "<span class='fa fa-circle'></span>" + getFilterTitle("At_high_risk") + ":  "  + d.At_high_risk + "%"  + boldOff.At_high_risk;
        }
        return tip
    });




// Use the Queue.js library to read two files

queue()
  .defer(d3.json, "data/africa.topo.json")
  .defer(d3.csv, "data/global-malaria-2015.csv")
  .await(function(error, mapTopJson, malariaDataCsv){

      console.log(mapTopJson);
      console.log(malariaDataCsv);

      // save to global variables
      mapData = mapTopJson;
      countryData = malariaDataCsv;

      // convert topoJSON to GeoJSON and merge data
      structureData();

      // show initial choropleth rendering
      initializeChoropleth();



  });




//  convert TopoJSON data and map malaria data to
function structureData() {

    // Convert TopoJSON to GeoJSON (target object = 'states')
    africa = topojson.feature(mapData, mapData.objects.collection).features;

    // filter out non-african countries
    africa = africa.filter( function(d) {
        return (d.properties.continent == "Africa");
    });

    // add malaria data to GeoJSON array
    for (var i=0; i<countryData.length; i++) {
        var countryCode = countryData[i].Code;      // global-malaria-2015.csv - country code

        for (var j=0; j<africa.length; j++) {
            var jsonCode = africa[j].properties.adm0_a3_is;     // africa.topo.json - country code

            // map data for matching countries
            if (countryCode == jsonCode) {
                africa[j].At_high_risk = +countryData[i].At_high_risk ;
                africa[j].At_risk = +countryData[i].At_risk ;
                africa[j].Code = countryData[i].Code ;
                africa[j].Country = countryData[i].Country ;
                africa[j].Malaria_cases = +countryData[i].Malaria_cases ;
                africa[j].Suspected_malaria_cases = +countryData[i].Suspected_malaria_cases ;
                africa[j].UN_population = +countryData[i].UN_population ;
                africa[j].WHO_region = countryData[i].WHO_region ;
            }
        }
    }

    console.log(africa);
}



function initializeChoropleth() {

    // define scale domain
    color
        .domain([d3.min(africa, function (d) { return d[mapFilter]; }),
            d3.max(africa, function (d) { return d[mapFilter]; })]);


    // invoke tip
    mapSvg.call(tip);

    // render map and initial colors
    mapSvg.selectAll("path")
        .data(africa)
        .enter().append("path")
        .attr("class", "map")
        .attr("d", path)
        .style("fill", function (d) {
            var value = d[mapFilter];    // only change fill for countries with valid data
            if (value) {
                return color(value);
            }
            else {
                return "white";
            }
        })
        .on("mouseover", function(d) { if (d.Country) tip.show(d); })      // only show for countries in dataset
        .on("mouseout", tip.hide);

    updateLegend();

    // listen for change in dropdown select box
    getMapInput();
}



//  updata map rendering based on user selection
function updateChoropleth() {

    // update scale domain based on filtered data
    color
        .domain([d3.min(africa, function(d) { return d[mapFilter]; }),
                 d3.max(africa, function(d) { return d[mapFilter]; }) ]);

    // invoke tool tip
    mapSvg.call(tip);

    // update choropleth colors
    mapSvg.selectAll("path")
        .style("fill", function (d) {       // only change fill for countries with valid data
            var value = d[mapFilter];
            if (value) {
                return color(value);}
            else {
                return "white";
            }
        })
        .on("mouseover", function(d) { if (d.Country) tip.show(d); } )      // only show for countries in dataset
        .on("mouseout", tip.hide);


    //newLegend();

    updateLegend();

    // listen for change in dropdown select box
    getMapInput();
}


// draw legend and update colors and text labels to match filter
function updateLegend() {

    // data join bars
    var bars = legendSvg.selectAll("rect")
        .data(colorScheme);

    // add bars for legend keys
    bars
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", function(d, i) { return i* legendHeight/colorSchemeSteps ; })
        .attr("width", 10)
        .attr("height", legendHeight/colorSchemeSteps);

    // update color based on filter
    bars
        .style("fill", function(d) { return d; });


    // data join labels
    var labels = legendSvg.selectAll("text")
        .data(color.range());

    // add text for labels
    labels
        .enter()
        .append("text")
        .attr("class", ".legend-text");

    // update label text based on filter / calculate ranges
    labels
        .attr("x", 20)
        .attr("y", function(d, i) { return (legendHeight/10) + (i* legendHeight/colorSchemeSteps) ; })
        .style("alignment-baseline", "middle")
        .text(function(d, i) {
            //  derive scale input rang from color scale value
            var stepRange = color.invertExtent(d);
            //  format numbers to abbreviated values and display min/max range
            return format[mapFilter](stepRange[0]) + "  -  " + format[mapFilter](stepRange[1]);
        });


    bars.exit().remove();

    // remove old labels
    labels.exit().remove();

}



// listen for user input and update visualization
function getMapInput() {

    // filter event listener starts callback function
    d3.select("#map-select").on("change", function(){
        // set global filter var
        mapFilter = d3.select("#map-select").property("value");

        // change color scheme to match filter, if necessary
        updateColorScheme();
        color.range(colorScheme);

        updateChoropleth();
    });

}




// convert filter values to nicer labels
function getFilterTitle (f) {
    var stat;

    switch (f) {
        case "UN_population":
            stat = "Population Size";
            break;
        case "At_risk":
            stat = "Population at risk";
            break;
        case "At_high_risk":
            stat = "Population at high risk";
            break;
        case "Suspected_malaria_cases":
            stat = "Suspected malaria cases";
            break;
        case "Malaria_cases":
            stat = "Malaria cases";
            break;
    }
    return stat;
}


// update color scale based on filter setting (blues for population, reds for malaria data)
function updateColorScheme() {

    var theme;

    switch (mapFilter) {
        case "UN_population":
            theme = "Blues";
            break;
        case "At_risk":
            theme = "Reds";
            break;
        case "At_high_risk":
            theme = "Reds";
            break;
        case "Suspected_malaria_cases":
            theme = "Reds";
            break;
        case "Malaria_cases":
            theme = "Reds";
            break;
    }

    colorScheme = colorbrewer[theme][colorSchemeSteps];

}



// number formatter for legend / abbreviate and round with prefix symbol
// e.g.,  123,456,789  --->   123.5 M
var format = {
    UN_population: function (n) {
        var prefix = d3.formatPrefix(n);
        return d3.round(prefix.scale(n), 1) + " " + prefix.symbol;
    },
    At_risk: function(n) {
        return d3.format(".1f")(n) + "%";
    },
    At_high_risk : function(n) {
        return d3.format(".1f")(n) + "%";
    },
    Malaria_cases: function (n) {
        var prefix = d3.formatPrefix(n);
        return d3.round(prefix.scale(n), 1) + " " + prefix.symbol;
    },
    Suspected_malaria_cases: function (n) {
        var prefix = d3.formatPrefix(n);
        return d3.round(prefix.scale(n), 1) + " " + prefix.symbol;
    }
};
