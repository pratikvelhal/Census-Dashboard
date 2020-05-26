updateDrawMap();

var states= null;
var counties = null;
var colorScale = null;
var statePaths = null;
var svg = null;
var path =null;
var projection = null;
var selectedState = -1;
var padding = 0
var width = 580
var height = 320
var legendsvg = null;

function updateDrawMap(){
  $.get("/healthCareMap", function(data, status){
    var mapdata = JSON.parse(data.healthdata.mapdata);
    var maplabel = JSON.parse(data.healthdata.maplabel);
    var wordclouddata = JSON.parse(data.healthdata.wordclouddata)
    drawMap(mapdata,maplabel);
    DrawWordCloud(wordclouddata,"HealthCare");
    //updateHistogram();
  });
}
function drawMap(mapdata,maplabel)
{
    d3.select("#map").selectAll("*").remove();


    var color = d3.scaleThreshold()
        .domain([0.028, 0.038, 0.048, 0.058, 0.068, 0.078])
        .range(["rgb(213,222,217)","rgb(69,173,168)","rgb(84,36,55)","rgb(217,91,67)", '#fde0ef', '#e9a3c9', '#c51b7d'])

    projection = d3.geoAlbers()
        .precision(0)
        .scale(height * 2).translate([width / 2, height / 2])

    path = d3.geoPath().projection(projection)

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-5, 0])
      .html(function(d) {
           return d.statedesc.State +": " +d.properties.Percent;
      })


    svg = d3.select('#map')
        .append('svg')
        .attr('class', 'map-class')
        .attr('width', width)
        .attr('height', height);
    //d3.select('#map').attr("style", "border: black 2px solid;");

    svg.call(tip);

    d3.queue()
        .defer(d3.json, '/static/us-states.json')
        .defer(d3.json, '/static/us-counties.json')
        .awaitAll(initialize)


    function initialize(error, results) {
    if (error) { throw error }

    var data = mapdata

    var colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

    var len = colors.length-1;
    colorScale = d3.scaleQuantile()
      .domain([d3.min(data, function(d) {
        return d.Percent;
      }), d3.max(data, function(d) {
        return d.Percent;
      })])
      .range(colors);

    //console.log("Mapdata:"+data)
    states = topojson.feature(results[0], results[0].objects.states).features
    //console.log(states);
    counties = topojson.feature(results[1], results[1].objects.counties).features
    //console.log(stateMap);
    var statemap = stateMap;

    states.forEach(function (f) {
        f.properties = data.find(function (d) { return d.ST === f.id })
        f.statedesc  = statemap.find(function (d) { return (d.Id*1000) === f.id })
    })

    counties.forEach(function (f) {
        f.properties = data.find(function (d) { return d.ST === Math.round(f.id/1000)*1000 }) || {}
    })

    statePaths = svg.selectAll('.state')
        .data(states)
        .enter().append('path')
        .attr('class', 'state')
        .attr('d', path)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style('fill', function (d) { return colorScale(d.properties.Percent) })
        .on('click', function (d) { stateZoom(d.statedesc.State) })

    column(maplabel, colorScale);
    //$('.map-text').append(document.createTextNode(maplabel));
    document.getElementById("maplabel").innerHTML = maplabel;
    //Adding legend
    // var legend = svg.append("g")
    //           .attr("class","legend")
    //           .attr("transform",`translate(${0.3*width}, ${-100})`)
    //           .style("font-size","12px");
    //
    // legend.append('rect')
    //     .attr("width", 102)
    //     .attr("height", 151)
    //     .attr("x", 187)
    //     .attr("y", 112)
    //     .attr("style","fill: white");
    // for(let i = 0; i <10; i++){
    //   legend.append("circle").attr("cx",200).attr("cy",130 + i*30).attr("r", 4).style("fill", colors[i]);
    //   legend.append("text").attr("x", 220).attr("y", 130 + i*30)
    //       .text("Dummy").style("font-size", "12px").attr("alignment-baseline","middle");
    }

    function column(title, scale) {
      var legend = d3.legendColor()
        .labelFormat(d3.format(",.1f"))
        .cells(10)
        .scale(scale);

      /* Uncomment below lines for legend*/
      //var div = d3.select("#map").append("div")
      //  .attr("class", "legend");

      //div.append("h5").text(title);

      legendsvg = svg.append("svg");

      var legendrect = legendsvg.append("g")
        .attr("class", "legendQuant")
        .attr("font-size", 12)
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      var percentlabel = d3.select(".map-class").append('text');

      percentlabel
        .attr("id","percentlabel")
        .attr('x', 525)
        .attr('y', 145) //Since total height is 2 * margin + height value. Adjusted manually
        .attr('text-anchor', 'middle')
        .text("Percentage")
        .attr("style","font-size: 12px");

      legendsvg.select(".legendQuant")
        .call(legend);

        var element = legendsvg.node();

        var legendheight = element.getBoundingClientRect().height;
        var legendwidth = element.getBoundingClientRect().width;

        legendsvg.attr("x",width-legendwidth+1);
        legendsvg.attr("y",height-legendheight);

    };
}




function usZoom() {
        legendsvg.attr("visibility", "visible");
        percentlabel.style.visibility ="visible";
        d3.select(".map-class > rect").attr("visibility", "visible");
        d3.select("#holdertext").remove();
        var t = d3.transition().duration(800)

        projection.scale(height * 2).translate([width / 2, height / 2])

        statePaths.transition(t)
            .attr('d', path)
            .style('fill', function (d) { return colorScale(d.properties.Percent) })

        svg.selectAll('.county')
            .data([])
            .exit().transition(t)
            .attr('d', path)
            .style('opacity', 0)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .remove();
        updateParaCoordData(-1);
        updateMCA(-1);
        drawHistogram(-1, [], [], []);
        updateWordCloud(-1);
        selectedState = -1;
    }

    function stateZoom(statename) {
            // console.log(statename);
        d3.select("#holdertext").remove();
        legendsvg.attr("visibility", "hidden");
        percentlabel.style.visibility ="hidden";
        d3.select(".map-class > rect").attr("visibility", "hidden");
        var state = states.find(function (d) { return d.statedesc.State === statename })
        var id = state.id;
        var stateCounties = counties.filter(function (d) {
            return d.id > id && d.id < id + 1000
        })

        var t = d3.transition().duration(800)

        var countyPaths = svg.selectAll('.county')
            .data(stateCounties, function (d) { return d.id })

        var enterCountyPaths = countyPaths.enter().append('path')
            .attr('class', 'county')
            .attr('d', path)
            .style('fill', function (d) { return colorScale(d.properties.Percent) })
            .style('opacity', 0)
            .style("stroke", "#fff")
            .style("stroke-width", "0.5")
            .on('click', function () { usZoom() })

        projection.fitExtent(
            [[padding, padding], [width - padding, height - padding]],
            state
        )

        statePaths.transition(t)
            .attr('d', path)
            .style('fill', '#444')

        enterCountyPaths.transition(t)
            .attr('d', path)
            .style('opacity', 1)

        countyPaths.exit().transition(t)
            .attr('d', path)
            .style('opacity', 0)
            .remove()


//Add the SVG Text Element to the svgContainer
var text = svg.append("text")
        .attr("id","holdertext")
        .attr("transform",
              "translate(" + (width/2) + " ," +
                             ( height/2) + ")")
        .style("text-anchor", "middle")
        .style('stroke', function () {return invertColor(colorScale(state.properties.Percent))})
        .style('stroke-opacity', '1')
        .attr('font-size', 20)
            .text(state.statedesc.State +": " +state.properties.Percent+ " %");

        updateParaCoordData(state.statedesc.Id);
	    updateMCA(state.statedesc.Id);
        drawHistogram(state.statedesc.Id, [], [], []);
        updateWordCloud(state.statedesc.State);
        selectedState = state.statedesc.Id;
    }

function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

//console.log(invertHex("#081d58"))
