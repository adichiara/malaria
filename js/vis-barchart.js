


var margin = {top: 40, right: 10, bottom: 60, left: 100};

var width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


var barSvg = d3.select("#bar-chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var barLegendSvg = d3.select("#chart-legend-area").append("svg")
    .attr("width", 300)
    .attr("height", 400);

// Scales
var xScale = d3.scale.ordinal()
    .rangeRoundBands([0, width], .2);

var yScale = d3.scale.linear()
    .range([height, 0]);


// setup x-axis
var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

var xAxisGroup = barSvg.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", "translate(0," + (height) + ")")
    .append("text")
    .attr("x", width/2)
    .attr("y", 50)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Year");


// setup y-axis
var yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(6)
    .tickFormat(d3.format("$,"))
    .orient("left");

var yAxisGroup = barSvg.append("g")
    .attr("class", "axis y-axis")
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 10)
    .attr("y", -margin.left *.8)
    .attr("x", -height *.5)
    .style("text-anchor", "middle")
    .text("Funding Level, in millions (USD)");


// define scale for bar colors / categorical data
var barColors = d3.scale.category10();


/* Initialize tooltip */
var barTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d, i) { console.log("d: " + d.x + " i:" + i);  return (d.source + "</br>" + d3.format("$,")(d.y) + " million (USD)"); });
    /*
        Source Name
        $###.# in Millions (USD)
     */


// global fund data
var fundData;
var fundSources = [
    "Global Fund",
    "United States",
    "Domestic Resources",
    "United Kingdom",
    "World Bank",
    "All Other Sources"
];

var layers = [];    // global array for restructured data


// Initialize data
loadData();

// Load CSV file
function loadData() {
    d3.csv("data/global-funding.csv", function(error, rawData) {

        // convert numeric strings
        rawData.forEach(function(d){

            for (var i=0; i<fundSources.length; i++) {
                d[fundSources[i]] = +d[fundSources[i]];

                if (d[fundSources[i]]=="NaN") { d[fundSources[i]] = 0; }

                // remove combined total column from data / limit data to individual sources
                delete d.Total;

            }
        });

        fundData = rawData;
        console.log(fundData);

        structureBarData();

        drawStackedBarChart();

    });

}



// create array of arrays for stacked layout structure
function structureBarData(){

    layers = d3.layout.stack()(
        fundSources.map( function(s) {
            return fundData.map(function(d) {
                return {
                    x: d.year,
                    y: d[s],
                    source: s
                };
            });
        }));

}

function drawStackedBarChart() {

    // define scale input domains
    xScale
        .domain(fundData.map(function(d) { return d.year; }));

    yScale
        .domain([0, d3.max(layers, function(d) {
                return d3.max(d, function(d) {
                    return d.y0 + d.y; }); })  *1.1  ]);


    // invoke tip
    barSvg.call(barTip);


    // define and set colors for each bar group
    var sourceGroup = barSvg.selectAll(".layer")
        .data(layers)
        .enter()
        .append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) {
            return barColors(i);
        });



    // draw bars for each group
    var bars = sourceGroup.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScale(d.x);
        })
        .attr("y", function(d) {
            return yScale(d.y0 + d.y);
        })
        .attr("height", function(d) {
            return yScale(d.y0) - yScale(d.y0 + d.y);
        })
        .attr("width", xScale.rangeBand())
        .on("mouseover", barTip.show)
        .on("mouseout", barTip.hide);




    // call axes
    barSvg.select(".x-axis").call(xAxis);
    barSvg.select(".y-axis").call(yAxis);

    // add legend
    showBarLegend();

}



// add bar chart legend
function showBarLegend() {

    var bars = barLegendSvg.selectAll("rect")
        .data(fundSources)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", function(d, i) { return 290 - i * 40 ; })
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", function(d, i) { return barColors(i); });


    var labels = barLegendSvg.selectAll("text")
        .data(fundSources);

    labels
        .enter()
        .append("text")
        .attr("class", ".legend-text")
        .attr("x", 30)
        .attr("y", function(d, i) { return 300 - i * 40   ; })
        .style("alignment-baseline", "middle")
        .text(function(d, i) { return d; });

}

