updateMCA(-1);
function updateMCA(state){
  $.get("/mca?state="+state, function(data, status){
    var data = JSON.parse(data);
    $( ".mca-graph" ).remove();
    plotMCA(data);
  });
}
function plotMCA(data){
      var margin = {top: 10, right: 5, bottom: 38, left: 32};
      var width = 420 - margin.left - margin.right;
      var height = 320 - margin.top - margin.bottom;

      minY = Math.floor(data.reduce((min, p) => p.y < min ? p.y : min, data[0].y))-0.35;
      maxY = Math.ceil(data.reduce((max, p) => p.y > max ? p.y : max, data[0].y))+0.35;
      minX = Math.floor(data.reduce((min, p) => p.x < min ? p.x : min, data[0].x))-0.35;
      maxX = Math.ceil(data.reduce((max, p) => p.x > max ? p.x : max, data[0].x))+0.35;

      var scaleX = d3.scaleLinear().domain([minX , maxX]).range([ 0, width ]);
      var scaleY = d3.scaleLinear().domain([minY , maxY]).range([ height, 0]);
      var svg = d3.select(".mca-holder")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height+margin.top + margin.bottom)
            .attr('class', 'mca-graph')

      var chart = d3.select(".mca-graph");
      //chart.attr("style", "border: black 2px solid;");

      /* Shifting the chart to exclude the margins*/
      var grp = chart.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

      /* Creating x-axis. Note y-axis starts from top */
      grp.append("g").call(d3.axisBottom(scaleX).ticks(0)).attr('transform', `translate(0, ${scaleY(0)})`);

      /* Creating y-axis */
      grp.append("g").call(d3.axisLeft(scaleY).ticks(0)).attr('transform', `translate(${scaleX(0)}, ${0})`);

      /* Creating x-axis. Note y-axis starts from top */
      grp.append("g").call(d3.axisBottom(scaleX).ticks(5)).attr('transform', `translate(0, ${height})`);

      /* Creating y-axis */
      grp.append("g").call(d3.axisLeft(scaleY).ticks(5));

      grp.append("g").call(d3.axisRight(scaleY).ticks(0)).attr('transform', `translate(${width}, 0)`);

      grp.append("g").call(d3.axisTop(scaleX).ticks(0));

      
      var color = d3.scaleOrdinal()
                      .range([ "#377eb8", "#4daf4a", "#ff7f00"]);
      //Adding legend
      var legend = svg.append("g")
                .attr("class","legend-para")
                .attr("transform",`translate(120, 100)`)
                .style("font-size","12px");

      legend.append('rect')
          .attr("width", 100)
          .attr("height", 60)
          .attr("x", 190)
          .attr("y", 120)
          .attr("style","fill: white");

      yPad = 20;
      legend.append("circle").attr("cx",200).attr("cy",130 + 0*yPad).attr("r", 4).style("fill", color(0));
      legend.append("text").attr("x", 210).attr("y", 130 + 0*yPad)
          .text("Education").style("font-size", "11px").attr("alignment-baseline","middle");

      legend.append("circle").attr("cx",200).attr("cy",130 + 1*yPad).attr("r", 4).style("fill", color(1));
      legend.append("text").attr("x", 210).attr("y", 130 + 1*yPad)
          .text("Race").style("font-size", "11px").attr("alignment-baseline","middle");

      legend.append("circle").attr("cx",200).attr("cy",130 + 2*yPad).attr("r", 4).style("fill", color(2));
      legend.append("text").attr("x", 210).attr("y", 130 + 2*yPad)
          .text("Employment").style("font-size", "11px").attr("alignment-baseline","middle");


      var gdots =  svg.selectAll("g.dot")
                      .data(data)
                      .enter().append('g');
      gdots.append("circle")
          .attr("class", "dot")
          .attr("r", 3)
          .attr("cx", function (d) {
              return scaleX(d.x);
          })
          .attr("cy", function (d) {
              return scaleY(d.y);
          })
          .style("fill", function (d) {
              return color(d.type);
          });
      gdots.append("text").text(function(d){
                   return d.index;
               })
               .attr("x", function (d) {
                   return scaleX(d.x);
               })
               .attr("y", function (d) {
                   return scaleY(d.y);
               });
     circles = svg.selectAll("circle");

     function highlightBrushedCircles() {

         if (d3.event.selection != null) {

             // revert circles to initial style
             circles.attr("class", "non_brushed");

             var brush_coords = d3.brushSelection(this);

             // style brushed circles
             circles.filter(function (){

                var cx = d3.select(this).attr("cx"),
                    cy = d3.select(this).attr("cy");

                return isBrushed(brush_coords, cx, cy);
            })
            .attr("class", "brushed");
         }
     }
     function updateBarChart() {

          // disregard brushes w/o selections
          // ref: http://bl.ocks.org/mbostock/6232537
          if (!d3.event.selection) {
            circles.attr("class", "non_brushed");
            return;
          }

          // programmed clearing of brush after mouse-up
          // ref: https://github.com/d3/d3-brush/issues/10
          // d3.select(this).call(brush.move, null);

          var d_brushed =  d3.selectAll(".brushed").data();

          // populate table if one or more elements is brushed
          if (d_brushed.length > 0) {
              let races = [];
              let edu = [];
              let emp = [];
              d_brushed.forEach(d_row => {
                if(d_row.type == 1)
                  edu.push(d_row.index);
                else if(d_row.type == 2)
                  races.push(d_row.index);
                else
                  emp.push(d_row.index);
              });
              drawHistogram(selectedState, races, edu, emp);
          } else {
              //clearTableRows();
          }
      }

       var brush = d3.brush()
          .extent( [ [0,0], [width,height] ] )
          .on("brush", highlightBrushedCircles)
          .on("end", updateBarChart);

      svg.append("g")
       .call(brush);

       function isBrushed(brush_coords, cx, cy) {

           var x0 = brush_coords[0][0],
               x1 = brush_coords[1][0],
               y0 = brush_coords[0][1],
               y1 = brush_coords[1][1];

          return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
      }


        // legend.append("circle").attr("cx",200).attr("cy",130 + i*30).attr("r", 6).style("fill", color[i]);
        // legend.append("text").attr("x", 220).attr("y", 130 + i*30)
        //     .text("Cluster " + (i+1)).style("font-size", "15px").attr("alignment-baseline","middle");

        /* Y-axis label */
      chart.append('text')
        .attr('transform', 'rotate(270)')
        .attr('x', -(height / 2) - margin.top) // Behaving like y co-ord since rotated. Value is half of ht + offset(margin)
        .attr('y', margin.left * 0.4)	// Manually calculated
        .attr('text-anchor', 'middle')
        .text('Second Principal Component')
        .attr("style","font-size: 12px");

        /* X-axis label */
      chart.append('text')
        .attr('x', (width / 2) + margin.left)
        .attr('y', height + margin.top +  0.7*margin.bottom) //Since total height is 2 * margin + height value. Adjusted manually
        .attr('text-anchor', 'middle')
        .text("First Principal Component")
        .attr("style","font-size: 12px");

}
