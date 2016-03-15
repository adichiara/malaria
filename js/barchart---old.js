

// SVG drawing area

var margin = {top: 40, right: 10, bottom: 60, left: 100};

var chartWidth = 700 - margin.left - margin.right,
    chartHeight = 450 - margin.top - margin.bottom;


var svg = d3.select("#bar-chart-area").append("svg")
    .attr("width", chartWidth + margin.left + margin.right)
    .attr("height", chartHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Scales
var x = d3.scale.ordinal()
    .rangeRoundBands([0, chartWidth], .2);

var y = d3.scale.linear()
    .range([chartHeight, 0]);


// setup x-axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var xAxisGroup = svg.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", "translate(0," + (chartHeight) + ")")
    .append("text")
    .attr("x", chartWidth/2)
    .attr("y", 50)
    .attr("class", "axis-title")
    .style("text-anchor", "middle")
    .text("Year");


// setup y-axis
var yAxis = d3.svg.axis()
    .scale(y)
    .ticks(6)
    .tickFormat(d3.format("$,"))
    .orient("left");

var yAxisGroup = svg.append("g")
    .attr("class", "axis y-axis")
    .append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("y", 10)
    .attr("y", -margin.left *.8)
    .attr("x", -chartHeight *.5)
    .style("text-anchor", "middle")
    .text("Funds provided, in millions (USD)");


// add chart title
svg.append("text")
    .attr("class", "chart-title")
    .text("Yearly funds provided: " + fundFilter)
    .attr("transform", "translate(" + chartWidth/2 + ", " + (-1 * margin.top/2) + ")")
    .style("text-anchor", "middle");


/* Initialize tooltip */
var barTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) { return d3.format("$,")(d[fundFilter]); });



// global fund variables
var fundData;
var fundSources = [
    "Global Fund",
    "United States",
    "Domestic Resources",
    "United Kingdom",
    "World Bank",
    "All Other Sources",
    "Total"
];


// Global filter var.  set filter to default select box value
var fundFilter = d3.select("#source-select").property("value");

// Initialize data
loadData();
// Load CSV file
function loadData() {
    d3.csv("data/global-funding.csv", function(error, rawData) {

        console.log(rawData);

        // convert numeric strings
        rawData.forEach(function(d){

            for (var i=0; i<fundSources.length; i++) {
                d[fundSources[i]] = +d[fundSources[i]];
            }
        });

        fundData = rawData;

        //
        renderBarChart();

    });
}


// Render visualization
function renderBarChart() {

    console.log(fundFilter);

    // Data-join
    var barchart = svg.selectAll("rect")
        .data(fundData, function(d) { return d.year; });

    // update scale range
    x.domain(fundData.map(function(d) { return d.year; }));
    //y.domain([0,d3.max(fundData, function(d) { return d.Total })]);  // set range as static for all data representations, based on max of total funds

    y.domain([0, d3.max(fundData, function(d) { return d[fundFilter] }) * 1.10 ]);


    // invoke tip
    svg.call(barTip);


    // Enter
    barchart.enter()
        .append("rect")
        .attr("class", "bar")
        .on("mouseover", barTip.show)
        .on("mouseout", barTip.hide);

    // Update
    barchart
        .transition()
        .duration(500)
        .attr("x", function(d) { return x(d.year); })
        .attr("y", function(d) { return y(d[fundFilter]); })
        .attr("width", x.rangeBand())
        .attr("height", function(d) { return chartHeight - y(d[fundFilter]); });


    // update axes
    svg.select(".x-axis").transition().duration(500).call(xAxis);
    svg.select(".y-axis").transition().duration(500).call(yAxis);

    svg.select(".chart-title").transition().duration(500).text("Yearly funds provided: " + fundFilter);

    // Exit
    barchart.exit().transition().duration(500).remove();

    // listen for user input for fund selection
    getChartInput();
}





function getChartInput() {

    // filter event listener starts callback function
    d3.select("#source-select").on("change", function () {

        // set global filter var
        fundFilter = d3.select("#source-select").property("value");

        renderBarChart();

    });
}

