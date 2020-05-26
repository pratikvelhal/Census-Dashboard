drawHistogram(-1, [], [], [])

function drawHistogram(state, races, edu, emp)
{
    url = "/barchart";
    filters = {
      "races": races,
      "state": state,
      "edu": edu,
      "emp": emp
    }
    $.ajax({
        url: url,
        type: 'post',
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify(filters),
        success: function(data){
          updateHistogram(data);
        }
    });
}

function updateHistogram(data)
{
    console.log(data);
 d3.select("#histogram").selectAll("*").remove();
// set the dimensions and margins of the graph
var margin = {top: 20, right: 5, bottom: 40, left: 40},
    width = 300 - margin.left - margin.right,
    height = 320 - margin.top - margin.bottom;

// var colors = ["#edf8b1","#a1dab4", "#c7e9b4", "#7fcdbb","#2c7fb8" ,"#41b6c4", "#1d91c0"];
var colors = ["#c7e9b4", "#c7e9b4", "#c7e9b4", "#c7e9b4", "#c7e9b4" ,"#41b6c4", "#1d91c0"];
var colorScale = d3.scaleOrdinal();
colorScale.domain(data.map(function (d){ return d.MAR; }));
colorScale.range(colors);

// append the svg object to the body of the page
var svg = d3.select("#histogram")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, 100])
    .range([ 0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

  // Y axis
  var y = d3.scaleBand()
    .range([ 0, height ])
    .domain(data.map(function(d) { return d.MAR; }))
    .padding(.4);


  //Bars
  svg.selectAll("myRect")
    .data(data)
    .enter()
    .append("rect")
    .transition()
    .duration(800)
    .attr("x", 1 )
    .attr("y", function(d) { return y(d.MAR); })
    .attr("width", function(d) { return x(d.Percent); })
    .attr("height", y.bandwidth())
    .attr("fill", function (d){ return colorScale(d.MAR); });

      svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
      .style("text-anchor", "start")
      .attr("x", 10)
      .attr("font-size", 12)
      .style("fill", "black")

    svg.append("text")
        .attr("transform",
              "translate(" + (width/2) + " ," +
                             (height + margin.top + 15) + ")")
        .style("text-anchor", "middle")
        .style('stroke', '#0b1a38')
        .style('stroke-opacity', '0.3')
        .attr('font-size', 12)
        .text("Percentage");

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+10)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style('stroke', '#0b1a38')
        .style('stroke-opacity', '0.3')
        .attr('font-size', 12)
        .text("Marital Status");

}
