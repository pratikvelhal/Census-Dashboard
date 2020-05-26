var objectdict = {};
var currentelement = null;

function DrawWordCloud(data,label){

  document.getElementById("wordcloudlabel").innerHTML = "State "+label+" Score";
	//console.log(data);
	d3.select(".cloud").selectAll("*").remove();

    data.forEach(function (f) {
    	var properties = stateMap.find(function (d) { return (d.Id) === f.ST });
    	f.text = properties.State;
        //f.properties = data.find(function (d) { return d.ST === f.id })
        f.value  = f.SCORE;
    })
    //console.log(data);


var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 360 - margin.left - margin.right,
    height = 126 - margin.top - margin.bottom;
    
    /*
    Use this:
    var margin = {top: 30, right: 10, bottom: 20, left: 10};
    var width = 720 - margin.left - margin.right;
    var height = 210 - margin.top - margin.bottom;

    */
      var minfont = 10;
  var maxfont = 19;
  var minvalue=0;
  var maxvalue=1;

//var data = skills

  //var categories = d3.keys(d3.nest().key(function(d) { return d.category; }).map(data));
  var color = d3.scaleBand().range(["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854"]);
  var fontSize = d3.scalePow().exponent(5).domain([0,1]).range([10,80]);

  const fontFamily = "Verdana, Arial, Helvetica, sans-serif";

  	 var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-5, 0])
      .html(function(d) {
           return "State "+ label +" Score: " + Math.round(d*100)/100;
      })

    var svg = d3.select(".cloud").append("svg")
    .attr("id", "word-cloud")
    .attr("viewBox", [0, 0, width, height])
    .attr("font-family", fontFamily)
    .attr("text-anchor", "middle");

    svg.call(tip);

  const displaySelection = svg.append("text")
    .attr("font-family", "Lucida Console, Courier, monospace")
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "hanging")
    .attr("x", 10)
    .attr("y", 10);

  var layout = d3.layout.cloud()
      //.timeInterval(10)
      .size([width, height])
      .words(data.map(d => Object.create(d)))
      .padding(3)
      .rotate(function(d) { return 0; })
      .font(fontFamily)
      .fontSize(function(d) {return toFontSize(d.value);})
      //.text(function(d) { return d.text; })
      //.spiral("archimedean")
      .on("word", ({size, x, y, rotate, text, value}) => {

      	idtext = text.replace(/ /g,"");
      	idtext = idtext.replace("/","");

      svg.append("text")
        .attr("font-size", size)
        .attr("transform", `translate(${x},${y}) rotate(${rotate})`)
        .text(text)
        .attr("id", idtext)
        .attr("sid",text)
        .classed("click-only-text", true)
        .classed("word-default", true)
        
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick);


        //console.log(idtext);
      objectdict[text]= d3.select(this);


        function handleMouseOver(d, i) {
          d3.select(this)
            .classed("word-hovered", true)
            .transition(`mouseover-${text}`).duration(200).ease(d3.easeLinear)
              .attr("font-size", size + 2)
              .attr("font-weight", "bold");          
          tip.show(value);
        }

        function handleMouseOut(d, i) {
          d3.select(this)
            .classed("word-hovered", false)
            .interrupt(`mouseover-${text}`)
              .attr("font-size", size)
              .attr("font-weight", "normal");
          tip.hide();
        }

        function handleClick(d, i) {
          var e = d3.select(this);
        if(currentelement!=null)
        {
        	currentelement.classed("word-selected", !currentelement.classed("word-selected"));
        	if(currentelement.attr("id")!=e.attr("id"))
        	{
        		e.classed("word-selected", !e.classed("word-selected"));
          		currentelement = e;
          		stateZoom(e.attr("sid"));
        	}
        	else
        	{
        		currentelement=null;
        		usZoom();
        	}
        }
        else
        {
        	e.classed("word-selected", !e.classed("word-selected"));
          	currentelement = e;
          	usZoom();
          	stateZoom(e.attr("sid"));
        }
          //displaySelection.text(`selection="${e.text()}"`);

        }

    })
      .start();


  function toFontSize(value) {
      // translate value scale to font size scale and apply relevancy factor
      lineairSize = (((value - minvalue) / (maxvalue - minvalue)) * (maxfont - minfont)) + minfont;
      // make the difference between small sizes and bigger sizes more pronounced for effect
      var polarizedSize = Math.pow(lineairSize / 8, 3);
     // reduce the size as the retry cycles ramp up (due to too many words in too small space)
      var reduceSize = polarizedSize;
       return ~~reduceSize;
    }
}

function updateWordCloud(statename){
	if(statename==-1)
	{
		if(currentelement==null)
			return;
		currentelement.classed("word-selected", !currentelement.classed("word-selected"));
		currentelement=null;
		return;
	}
	if(currentelement!=null)
    {
    	currentelement.classed("word-selected", !currentelement.classed("word-selected"));
    }
 	var state = statename;
 	state = state.replace(/ /g,"");
 	state = state.replace("/","");
 	state = '#' + state;
 	var element = d3.select(state);
 	if(element == undefined)
 		{
 			currentelement=null;
 			return;
		}
  else{
    element.classed("word-selected", !element.classed("word-selected"));
    currentelement = element;  
  }
}
