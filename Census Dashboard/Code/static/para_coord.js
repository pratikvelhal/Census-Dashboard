updateParaCoordData(-1);
function updateParaCoordData(state){
  $.get("/paracoord?state="+state, function(data, status){
    var data = JSON.parse(data);
    $( ".para-coord-graph" ).remove();
    plotParaCoord(data);
  });
}
function plotParaCoord(data){
    var margin = {top: 20, right: 10, bottom: 10, left: 10};
    var width = 720 - margin.left - margin.right;
    var height = 224 - margin.top - margin.bottom;

    var x = d3.scalePoint().range([0, width]).padding(1),
        y = {};

    var line = d3.line(),
        axis = d3.axisLeft(),
        background,
        foreground;

    var dimensions = null;

    var svg = d3.select(".para-coord-holder")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height+margin.top + margin.bottom)
          .attr('class', 'para-coord-graph')

    var para = d3.select(".para-coord-graph");
    // para.attr("style", "border: black 2px solid;");
    // para.attr("style", "background-color: #2F4A6D;");

    /* Shifting the chart to exclude the margins*/
    var grp = para.append("g").attr("transform", `translate(${-margin.left*5}, ${margin.top})`);

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
      return d != "Income_cat" && (y[d] = d3.scaleLinear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([height, 0]));
    }));

    // Add grey background lines for context.
    background = grp.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(data)
      .enter().append("path")
        .attr("d", path);

    var incomeCategories = ["Lowest", "Lower-mid", "Mid", "Upper-mid", "Highest"];
    var color = d3.scaleOrdinal()
                    .domain(incomeCategories)
                    .range([ "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8"])
    // Add blue foreground lines for focus.
    foreground = grp.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(data)
      .enter().append("path")
              .style("stroke", function(d){ return( color(d.Income_cat))} )
              .attr("d", path);

    // Add a group element for each dimension.
    const g = grp.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("text")
        .style("text-anchor", "middle")
        .style("font-weight", 600)
        .style("font-size","11px")
        .attr("y", -9)
        .text(function(d) { return d; });

    //Adding legend
    var legend = svg.append("g")
              .attr("class","legend-para")
              .attr("transform",`translate(${0.55*width}, ${-margin.top - 50})`)
              .style("font-size","12px");
    legend.append('text')
      .attr('x', 235)
      .attr('y', (height / 1.9)) //Since total height is 2 * margin + height value. Adjusted manually
      .attr('text-anchor', 'middle')
      .text("Family Income")
      .attr("style","font-size: 12px");

    legend.append('rect')
        .attr("width", 102)
        .attr("height", 151)
        .attr("x", 187)
        .attr("y", 112)
        .attr("style","fill: white");
    for(let i = 0; i <incomeCategories.length; i++){
      legend.append("circle").attr("cx",200).attr("cy",130 + i*30).attr("r", 6).style("fill", color(i));
      legend.append("text").attr("x", 220).attr("y", 130 + i*30)
          .text(incomeCategories[i]).style("font-size", "12px").attr("alignment-baseline","middle");
    }


    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.brushY()
              .extent([[-10,0], [10,height]])
              .on("brush", brush)
              .on("end", brush)
              )
          })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = [];
        svg.selectAll(".brush")
          .filter(function(d) {
                y[d].brushSelectionValue = d3.brushSelection(this);
                return d3.brushSelection(this);
          })
          .each(function(d) {
              // Get extents of brush along each active selection axis (the Y axes)
                actives.push({
                    dimension: d,
                    extent: d3.brushSelection(this).map(y[d].invert)
                });
          });

        var selected = [];
        // Update foreground to only display selected values
        foreground.style("display", function(d) {
            let isActive = actives.every(function(active) {
                let result = active.extent[1] <= d[active.dimension] && d[active.dimension] <= active.extent[0];
                return result;
            });
            // Only render rows that are active across all selectors
            if(isActive) selected.push(d);
            return (isActive) ? null : "none";
        });
    }
}
/*
NPF		2
	Number of persons in family (unweighted)
WIF		1
	Workers in family during the past 12 months
VEH		1
	Vehicles (1 ton or less) available
NOC		2
	Number of own children in household (unweighted)

FINCP		9
	Family income (past 12 months)





PINCP		7
	Total person's income (signed)


Person
INTP		6
	Interest, dividends, and net rental income past 12 months (signed)

JWMNP		3
	Travel time to work
JWRIP		2
	Vehicle occupancy
PAP		5
	Public assistance income past 12 months
RETP		6
	Retirement income past 12 months
SEMP		6
	Self-employment income past 12 months (signed)
SSP		5

	Social Security income past 12 months
WAGP		6
	Wages or salary income past 12 months
WKHP		2
	Usual hours worked per week past 12 months
PERNP		7
	Total person's earnings
*/
