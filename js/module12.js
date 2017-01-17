// initialize a custom namespace
var m12 = m12 || {};

//##############################################################################################################################
//initialize global variables

m12.b = void 0;//variable for map bounds  
m12.s = void 0; //variable for map scale
m12.t = void 0; //variable for map translate
m12.projection = void 0; //variable for d3 projection
m12.mapwidth = void 0; // the width of the map
m12.mapheight = void 0;  // the height of the map
m12.path = void 0;  //this stores helper object that reprojects the geometry
m12.collection = void 0;  //this stores the geojson of the municipalities polygons
m12.overijssel = void 0;  //this stores an array of the municipalities polygons
m12.centers = void 0; //this stores the geojson of the municipalities centers
m12.svg = void 0;   // a selction of the map ->  d3.select("#mapDiv")
 
m12.toTarget = true;  // emigration state(true) ; immigration state (false)
 
m12.matrix= void 0; // stores the immigration/emigration matrix data
m12.transposematrix = void 0; // stores the immigration/emigration transposed matrix data

m12.matrixbyid= void 0; //store the matrix as an object ( the key is the polygon cartoid, the value is the array)
m12.transposematrixbyid= void 0; //store the transposed matrix as an object ( the key is the polygon cartoid, the value is the array)
m12.municipalities= void 0;   //store provinces data, id,name,color (the id is the polygon cartoid)	
m12.municipalitiesobject = void 0; //store as a nested object (key is the polygon cartoid, value is the object )
m12.orderedID = void 0; //stores an object that map cartoid with the index of the municipalities id	  

m12.initialwidth = void 0; //the width of the column that will store the cord diagram


m12.topRowHeight = void 0;  //the height of the top row
m12.bottomRowHeight = void 0; //the height of the bottom row

m12.bottomheight = void 0;   //the desired height of the bottom row after inserting the chord and the bar chart

m12.pad = void 0;  //the vertical pad and the right pad for the bar chart
m12.left_pad = void 0; //the left pad for the bar chart

m12.x = void 0;  //the x  scale for the bar chart
m12.y = void 0; //the y  scale for the bar chart

 
m12.chorddata = void 0;   // a d3 selection for the chords -> svg.append("g").attr("class", "chord").selectAll("path").data(chord.chords)

//##########################################################################################################################################



//calculate the initial height of the nearby column and set as the mim height of the map 
// bind the window resize event	
m12.startlayout = function (thediv, setmin, fixed){	
		
	//get the maxheight of columns surrounding the map
	colH = m12.getColumnHeight(thediv);  
	
	windowH = document.documentElement.clientHeight;
	bodyH = document.body.clientHeight;
	room = windowH - bodyH;
	
	
	//set the minimun heigth  
	if (setmin){ 
		$( thediv ).css("min-height", setmin + "px");
	}else{
		$( thediv ).css("min-height", colH + "px");	
	}
					
	// define the map width 				
	$( thediv ).css("background", "#D8D8D8");
	$( thediv ).css("width", "auto");
	//console.log('I started');		
	
	// Expand map height 
	if (setmin && fixed){
		$( thediv ).css( "height", fixed + "px" );	
	}else{   //and bind resize event	
			
	$( thediv ).css( "height", colH + room + "px" );
	
	$( window ).resize(function() {
			windowH = document.documentElement.clientHeight;
			bodyH = document.body.clientHeight;
			room = windowH - bodyH;
			
			//the current height of the map			
			/*
			paddingTop =$( thediv ).css("padding-top");
			paddingBottom =$( thediv ).css("padding-bottom");
			marginTop =$( thediv ).css("margin-top");
			marginBottom =$( thediv ).css("margin-bottom");
			borderTopWidth =$( thediv ).css("border-top-width");
			borderBottomWidth = $( thediv ).css("border-bottom-width");
			p = parseInt(paddingTop, 10) + parseInt(paddingBottom, 10) || 0;
			g = parseInt(marginTop, 10) + parseInt(marginBottom, 10) || 0;
			bodyH2 = parseInt(borderTopWidth, 10) + parseInt(borderBottomWidth, 10) || 0;
			clientHeight = $( thediv )[0].clientHeight;
			//h = p + g + bodyH + this._mapDiv.clientHeight;
			mapH = p + g + bodyH2 + clientHeight;
			*/
			
			//get the maxheight of columns surrounding the map
			
			colH = m12.getColumnHeight(thediv);		
			
			/*mh1 = mapH + room;				
			mh2 = 0;				
			// Resize to neighboring column or fill page
			if (mapH < colH) {
				mh2 = (room > 0) ? colH + room : colH;
				console.log('mapH < colH');
			} else{
				mh2 =colH + room
				console.log('mapH > colH');
			}
			*/
			
			mh2 = colH + room;
			// Expand map height		
			$( thediv ).css( "height", mh2 + "px" );
			
			//bodyH = document.body.clientHeight;				
			//console.log("Win:" + windowH + " Body:" + bodyH + " Room: " + room + " OldMap:" + mapH + " Map+Room: " + mh1 + " NewMap: " + mh2+ " ColH: " + colH);// + " inCol:" + inCol);	
		
		}); //end window resize
	}//end else
		
	m12.initmap();   

}


//return the maxheight of columns surrounding the map div  //←灰色
m12.getColumnHeight = function(thediv){
	colH = 0;
	$cols = $( thediv ).closest(".row").children("[class*='col']");  //get the sorroundind colomns
	//console.log($cols);
		if ($cols.length) {
			$.each($cols, function() {
					containsMap = ($( thediv )[0] == $(this)[0]); //we exclude the column with the map
					//console.log($( thediv )[0]);
					//console.log($(this)[0]);
					//console.log($(this)[0].clientHeight);
					if (($(this).height() > colH) && !containsMap) {
								colH = $(this)[0].clientHeight;
								//console.log(colH);									
								}
			});
	}
	return colH	
}


//assign the map projection, initialize the map svg, start downloading cartodb layers
m12.initmap = function() {
  
  
	//store the height /width of the map
	var initialwidth = parseInt(d3.select('.map').style('width'), 10)
	var initialheight = parseInt(d3.select('.map').style('height'), 10) 
	m12.mapheight = initialheight;
	m12.mapwidth = initialwidth;
	//console.log('w ',m12.mapwidth,' h ',m12.mapheight); 

 
	//define projecttion
	m12.projection = d3.geo.mercator();
	// Special d3 helper that converts geo coordinates to pathsbased on a projection
	m12.path = d3.geo.path().projection(m12.projection);

	//initialize the svg 
	m12.svg = d3.select("#mapDiv")
	  .append("svg")
	  //.attr("width", m12.mapwidth);  //commented because css width/height : 100%
	  //.attr("height", m12.mapheight);


	//use queue to make sure cartodb data is loaded before starting the d3 visualization
	queue()
	//get the cartobd layer with the boundaries   (dp is the decimal precision)
	.defer(d3.json, "http://piccinini.cartodb.com/api/v2/sql?q=SELECT * FROM overijssel WHERE the_geom IS NOT NULL&format=geojson&dp=3")
	//get the cartobd layer with the municipalities centers
	.defer(d3.json, "http://piccinini.cartodb.com/api/v2/sql?q=SELECT * FROM centers WHERE the_geom IS NOT NULL&format=geojson&dp=3") 
	.await(m12.addMapLayers); //wait for the 2 layers to download before adding layers to map
	
};

// define the correct projection parameters (scale and translate)
//add the boundaries and municipalities centers to the map //轮廓
m12.addMapLayers = function (error, collection, collection2) {
		  
	//if there is an error downloading the data return
	if (error) return console.warn(error);

	//store the geojson data
	m12.collection = collection;
		  
	//we need to center the map, therefore we need to scale and translate the data
	m12.projection.scale(1).translate([0, 0]);
	m12.b = m12.path.bounds(collection);
	m12.s = .95 / Math.max((m12.b[1][0] - m12.b[0][0]) / m12.mapwidth, (m12.b[1][1] - m12.b[0][1]) / m12.mapheight);
	m12.t = [(m12.mapwidth - m12.s * (m12.b[1][0] + m12.b[0][0])) / 2, (m12.mapheight - m12.s * (m12.b[1][1] + m12.b[0][1])) / 2];
	m12.projection.scale(m12.s).translate(m12.t);

	//we create a svg group with a  class called boundary , this stores the polygon geometry
	var map = m12.svg.append('g').attr('class', 'boundary');	   
	  

	//define a d3 selection and bind the features to the d3 visualization
	m12.overijssel = map.selectAll("path").data(collection.features)
	
	//d3 enter (append geometry and attributes, and bind events), (the d3 update happens in the function  m12.mapresize) 
	m12.overijssel.enter().append("path")
	.attr("fill-opacity", 0.7)
	.attr("d", m12.path)
	.attr("name", function(d){return d.properties.gm_naam})
	.attr("id", function(d){return 'id' + d.properties.cartodb_id})
	.on("mouseover", function(d) {
						//console.log(d3.event.pageX, d3.event.pageY);
						  var div = document.getElementById('tooltip');
						  div.style.left = d3.event.pageX+10 +'px';
						  div.style.top = d3.event.pageY +10 +'px';
						  div.innerHTML = d.properties.gm_naam; 
	})
	.on("click.01", function(d){   //click.02 will be added later, in the add charts function
		m12.toTarget= (!m12.toTarget); m12.selectmunicipalities(gid(d));
	});				

	//gid(d) is the cartoid of the polygon
	var gid = function(d){
		return 'id'+d.properties.cartodb_id
	};
	
	//d3 Exit 		  
	m12.overijssel.exit().remove();

	//we create an svg group with a  class called centers , this stores the centers geometry
	var map = m12.svg.append('g').attr('class', 'centers');	   
	//define a d3 selection and bind the features to the d3 visualization		  
	m12.centers = map.selectAll("path").data(collection2.features)
		  
	//d3 enter(append geometry and attributes, and bind events) (the d3 update happens in the function  m12.mapresize) 
	//the opacity is zero, this layer will help creating connection lines between municipalities
	m12.centers.enter().append("path")
	.attr("fill-opacity", 0)
	.attr("d", m12.path)
	.attr("name", function(d){return d.properties.gm_naam})
	.attr("id", function(d){return 'id' + d.properties.goodcartodb_id})   //goodcartodb_id is the cartoid for the provinces polygons

	//d3 Exit 
	m12.centers.exit().remove();


	//append the groups that will store the connection between municipalities
	var connection = m12.svg.append('g').attr('class', 'connections');
	var connectiontext = m12.svg.append('g').attr('class', 'connectionstext');		  

	//when resize the map call the function to recalculate projection parameters(scale and translte)
	//m12.mapresize contains the d3 update for both m12.overijssel and m12.centers
	d3.select(window).on('resize', m12.mapresize);   


	//init the d3 charts
	m12.initd3()
}


//function that recalculate the projection parameters (scale and translate) and update the d3 map
//the connections between municipalities are deleted
m12.mapresize = function(){
	
	var newwidth = parseInt(d3.select('.map').style('width'), 10)
	var newheight = parseInt(d3.select('.map').style('height'), 10) 
	m12.mapheight = newheight;
	m12.mapwidth = newwidth;

	m12.s = .95 / Math.max((m12.b[1][0] - m12.b[0][0]) / m12.mapwidth, (m12.b[1][1] - m12.b[0][1]) / m12.mapheight);
	m12.t = [(m12.mapwidth - m12.s * (m12.b[1][0] + m12.b[0][0])) / 2, (m12.mapheight - m12.s * (m12.b[1][1] + m12.b[0][1])) / 2];
	m12.projection.scale(m12.s).translate(m12.t);

	//d3 Update 
	m12.overijssel.attr("d", m12.path)
	m12.centers.attr("d", m12.path) 

		
	//remove paths  change size时候动态线消失了
	var connection =d3.select(".connections")
	connection.selectAll("*").remove()  //remove old paths
	var connectiontext =d3.select(".connectionstext")
	connectiontext.selectAll("*").remove() //remove old path text 
  
} 


//calculate and store some layout measures and then download the csv data 
m12.initd3 = function (){

	//get the width of the column that will store the cord diagram
	m12.initialwidth = parseInt(d3.select('.col-xs-12.col-sm-4').style('width'), 10);
	
	//get the row heights/width
	m12.topRowHeight = parseInt(d3.select('#toprow').style('height'), 10);
	m12.midRowHeight = parseInt(d3.select('#midrow').style('height'), 10);
	m12.bottomRowHeight = parseInt(d3.select('#bottomrow').style('height'), 10);
	m12.bottomRowWidth = parseInt(d3.select('#bottomrow').style('width'), 10);
	//m12.bottomRightWidth = parseInt(d3.select('#bottomrowright').style('width'), 10);
	
	//console.log(m12.topRowHeight,m12.midRowHeight,m12.bottomRowHeight);
	
	//use queue to make sure data is loaded in a correct sequence before charts are created
	queue()
	//load csv data with the provinces id,name,color (the id is the polygon cartoid)
    .defer(d3.csv, "data/provinces.csv")
	//load csv data with the matrix data for emigration/immigration among municipalities
    .defer(d3.text, "data/overijsselverhuizen.csv")	
    .await(m12.addCharts); 
}


//store the dowloaded data and
//add d3 charts to the page (chord layout and barchart)	
m12.addCharts = function (error, municipalities, unparsedData) {
	
	//if there is an error exit
	if (error) return console.warn(error);
		  
	//store provinces data, id,name,color (the id is the polygon cartoid)
	m12.municipalities = municipalities
	//also store as a nested object (key is the polygon cartoid, value is the object )
	m12.municipalitiesobject = m12.toObject(m12.municipalities)   //

	//also define an object that map cartoid with the index of the municipalities id	  
	m12.orderedID = m12.cartoIdToOrdered(m12.municipalities)

	
	//store the matrix data as an array of arrays	  
	m12.matrix = d3.csv.parseRows(unparsedData);
	//also store the transposed matrix data
	m12.transposematrix = d3.transpose(m12.matrix);
	//but we need to convert string to numbers because javascript automatically converted numbers to strings  //数据转换 
	m12.stringToNumber(m12.matrix);
	m12.stringToNumber(m12.transposematrix);
		   
	
	//store the matrix as an object ( the key is the polygon cartoid, the value is the array)
	m12.matrixbyid = m12.toObject2(m12.matrix) ; 
	//do the samefor the transpoed matrix
	m12.transposematrixbyid = m12.toObject2(m12.transposematrix) ;
		  
		  
	//create a nested object to store the target municipalities (emigration)
	//the key is the polygon cartoid (the emigration source), the value is an array where each item 
	//is an object that stores polygon cartoid, value, municipality name (the emigration targets)
	m12.targetmunicipalities = m12.setlinkedmunicipalities(m12.matrix);
	//we do the same to store the source municipalities (immigration)
	//the key is the polygon cartoid (the immigration target), the value is an array where each item 
	//is an object that stores polygon cartoid, value, municipality name (the immigration sources)	
	m12.sourcemunicipalities = m12.setlinkedmunicipalities(m12.transposematrix);
	

	//update the color of the d3 selection of the municipalities polygons
	m12.overijssel.attr('fill', function(d,i){ return m12.municipalitiesobject[d.properties.cartodb_id].color;});
		 
		
	///////////////////build the chord layout//////////////////////////////////
					
	//initialize the chord layout with the matrix data
	var chord = d3.layout.chord()
		.padding(0.05)
		//.sortSubgroups(d3.descending)
		.matrix(m12.matrix);

	//here I calculate how I want want to share the space between the midcharts and the bottom charts, I chose 3/4 for the middle (1/4 for the bottom)
	var midheight = (m12.midRowHeight + m12.bottomRowHeight) * 3/4;
	m12.bottomheight = (m12.midRowHeight + m12.bottomRowHeight) - midheight;

	
	//I check I am inside the column width (the cord is in a square)
	var midwidth = m12.initialwidth < midheight ? m12.initialwidth : midheight; 

	var width = midwidth, //I check i am inside the column width 
		height = midwidth - 20,  //I can also give some more space for the bottom
		innerRadius = Math.min(width, height) * .41, //I define the chord radius
		outerRadius = innerRadius * 1.1;

		
	//we define a container class to store the svg, the svg will be responsive
	var svg = d3.select('#d3chord')
		.append("div")
		.classed("svg-container", true) //container class to make it responsive
		.style("padding-bottom", "100%") //the paddin is 100% because this responsive div is a square
		.append("svg")
		//responsive SVG needs these 2 attributes (and no width and height attr)
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0"+" " + width + " " + height)
		 //class to make it responsive
		.classed("svg-content-responsive", true)
		.append("g")  
		//we center the chord layout
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	//we create a d3 selection and we bing the chord.groups data (the update and exit will not be necessary because data will not change)
	//we add the chord groups svg geometry
	var g = svg.append("g").selectAll("g")
		.data(chord.groups)
		.enter().append("g").attr("class", "chordgroups")					
	var f = g.append("path")
		//we define the color for the arcs
		.style("fill", function(d,i) {return m12.municipalities[i].color;})
		.style("stroke", function(d,i) { return m12.municipalities[i].color;})
		.attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))			
		//we bind clck event twice
		//the click will change the visualization from immiration to emigration and draw the map connections
		.on("click.01",function(d,i) {
			  m12.toTarget=  (!m12.toTarget);
			  m12.selectmunicipalities('id'+m12.municipalities[i].id);	// [i] contains the row matrix index, but we need the cartoid of the polygon				  					  					 
		})
		//the clik also fades the other chords
		.on("click.02",m12.fade(.1))
			//we also visualize the municipality name when the ouse is over the chord group
			.append("title").text(function(d, i) {
				return m12.municipalities[i].name;
		});		

	//we create a d3 selection and we bing the chord.groups data (the update and exit will not be necessary because data will not change)		
	//we set the groups that will contain the text around the external ring
	var textlocation = d3.selectAll(".chordgroups")
		.data(chord.groups)
		.append("g")
		.attr("transform", function(d) {
			//console.log(chord.groups());
			return "rotate(" + ( d.startAngle * 180 / Math.PI-90) + ")"
			  + "translate(" + outerRadius + ",0)";
		});
	//and e append the municipality name
	textlocation.append("text")
		.text(function(d, i) {
			return m12.municipalities[i].name;
		})
		.attr("x",'5')					
		.attr("transform", "rotate(70)");
														
	

	
	//we create the chord geometry and we assign the target color starting clockwise from the first 
	////we store globally the chord.chord(so later we could change colors dinamically when we pass from emigration to immigration)
	m12.chorddata =svg.append("g").attr("class", "chord").selectAll("path").data(chord.chords)
				
	m12.chorddata.enter().append("path")
		.attr("d", d3.svg.chord().radius(innerRadius))
		.style("fill", function(d,i) { return m12.municipalities[d.target.index].color; })
		.style("opacity", 1);
	//m12.chorddata.exit().remove()
	  
	  
	//now that we have the chord layout we can add another click event to the map polygons
	d3.selectAll('.boundary').selectAll('path')
	.on('click.02', function(d){  //the d is the collection.features
		var i= m12.orderedID[d['properties']['cartodb_id']];  //we pass from the polygon cartoid to the ordered id  (which is necessary to select the chord)		  
		d3.select('#d3chord').selectAll(".chord path")
			//.transition()
			.style("opacity", 0.1)
			.filter(function(d) {return !(d.source.index != i && d.target.index != i); })
			//.transition()
			.style("opacity", 1);
	 });
				
	//////////build the bar chart///////////////////////
	
	m12.pad = 60;   //this is the pad height but also for width  
	m12.left_pad = 20;

	//define the x and y scales and their ranges
	m12.x = d3.scale.ordinal().rangeRoundBands([m12.left_pad, m12.bottomRowWidth - m12.pad], 0.1);
	m12.y = d3.scale.linear().range([m12.bottomheight-m12.pad, m12.pad]);

	//this will visualize the x scale
	var xAxis = d3.svg.axis().scale(m12.x).orient("bottom");

	//set the svg responsive to size changes
	var svg2 = d3.select("#d3emigration")
		.append("div")
		.classed("svg-container", true) //container class to make it responsive
		//set the padding-bottom as a fraction of the horizontal size
		.style("padding-bottom", ((m12.bottomheight/m12.bottomRowWidth)*100) +'%')  
		.append("svg")
		//responsive SVG needs these 2 attributes and no width and height attr
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0"+" " + m12.bottomRowWidth + " " + m12.bottomheight)
		 //class to make it responsive
		.classed("svg-content-responsive", true)
		//.append("g");
		//.attr("transform", "translate(" + m12.bottomRowWidth / 2 + "," + m12.bottomheight / 2 + ")")

	//append the x axis and put at the bottom		
	svg2.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0, "+(m12.bottomheight-m12.pad)+")")
		.call(xAxis);

	//now that everything is there call the function to resize the window, and fix the layout (jquery allow easily trigger events)
	$(window).trigger('resize');
	//I need to call mapresize because looks like d3 does not catch events triggered by jquery
	m12.mapresize();  
			
} //end init d3

// Returns an event handler for fading chords. 
m12.fade = function (opacity){ 
			  return function(d, i) {
				d3.select('#d3chord').selectAll(".chord path")
					//.transition()
					.style("opacity", opacity)
					.filter(function(d) {return !(d.source.index != i && d.target.index != i); })
					//.transition()
					.style("opacity", 1);
			 };
}


m12.selectmunicipalities = function (gid){    //gid is the cartoid of the provinces polygons 
	
	//select the municipality center and calculate the bbox
	var center = d3.select('.centers [id="'+gid+'"]')	
	var bbox = center.node().getBBox();
		
	//define if we are in target or in source mode
	//set a dash off-set accordingly
	if( m12.toTarget == true){
		var link = m12.targetmunicipalities[gid];
		var dashoffset = "-2000.00"
	} else{
		var link = m12.sourcemunicipalities[gid];
		var dashoffset = "2000.00"	
	}
		
	//d3 select the connection geometry and bind to data
	//the geometry is a line that starts from the selected municipality to the linked municipalities
	var conn = d3.select(".connections").selectAll('path').data(link)
		
	conn.enter()
		.append('path')
		.attr("class", "connection")
		.attr("stroke-width","3")
		.attr("stroke", "rgb(255,255,255)")
		.attr("stroke-dasharray","80 30")//length and gap
		.attr("stroke-dashoffset","0")//where the line start
		.attr("stroke-opacity","0.7")

	//d3 update
	conn.attr("d", function(d){ 
			//we create a line only if the value is >  0
			if( d['value']>0   ){
			var bbox2 = d3.select('.centers [id="'+d['cartoid']+'"]').node().getBBox();
			return ("M "+bbox.x+" "+ bbox.y+ " L " + bbox2.x +" "+ bbox2.y);
			} else{ return }
		})
		//we animate the dashoffset
		.transition()
		.duration(10000)
		.ease('linear') 
		.attr("stroke-dashoffset",dashoffset);
	
	//d3 exit
	conn.exit().remove();
		
	//d3 select the connection text and bind to data
	//the text location is calculated with the bbox of the linked municipality
	var connectiontext =d3.select(".connectionstext").selectAll('text').data(link)
	connectiontext.enter()
		.append('text')
		.attr("text-anchor", "middle")
		.style("font-size", "16px")
		.style("font-weight","bold") 						
		.attr("fill", "black") 				
								
	//d3 update
	connectiontext.attr("x", function(d){ 
		//we create a line only if the value is >  0
		if( d['value']>0){
		var bbox2 = d3.select('.centers [id="'+d['cartoid']+'"]').node().getBBox();
		return bbox2.x;
		} else{ return }
	})
	.attr("y",function(d){ if( d['value']>0){
		var bbox2 = d3.select('.centers [id="'+d['cartoid']+'"]').node().getBBox();
		return bbox2.y;
		} else{ return}
	})
	.text( function(d){ return d['value']});
		
	connectiontext.exit().remove()		
		
	/*
	m12.chorddata.style("fill", function(d) {
		console.log(m12.municipalities[d.target.index].name,d.target.index);
		//console.log(d.source);			
		if (m12.toTarget){return m12.municipalities[d.source.index].color;}
		else {return m12.municipalities[d.target.index].color;}
	})
	.style("opacity", 1);
	*/
	
	////finally we need to update the bar  chart
	m12.makeHisto(gid);		
}
/* bar chart
//this function create and update the barchart (this function is called when the user clicks on a map polygon or a chord group)
m12.makeHisto = function (gid){
	
	
	//check if we are in emigration or immigration mode, and therefore define the data (gid is the cartoid polygon) 
	if(m12.toTarget){ var data = m12.targetmunicipalities[gid];}
	else { var data = m12.sourcemunicipalities[gid]}
	
	//define the x and y scale domains  
	//x is ordinal, we just return an array of 24 values
	//y is linear, we return an interval between 0 and the max value for the selected muniipality
	m12.x.domain(data.map(function (d,i) { return i; }));
	m12.y.domain([0, d3.max(data, function (d) { return d.value; })]);
					
	
	
	//now we define a d3 selection to bind data to the bars
	var rects = d3.select("#d3emigration").select('svg').selectAll('rect').data(data);
	
	
	//d3 enter	
	 rects.enter()
		.append('rect')
		//we use slice because the format is 'idn' but we need only 'n'
		.style('fill', function (d){ return m12.municipalitiesobject[ d.cartoid.slice(2)].color}) 
		.attr('x', function (d,i) { return m12.x(i); }) //return the x range given the domain
		.attr('width', m12.x.rangeBand()) 
		.attr('y', function (d) {return m12.y(d.value); }) //return the y range given the domain
		.attr('height',"0") //we can do some animation starting from height 0
		.transition()
		.delay(function (d,i) { return i*5; })
		.duration(800)
		.attr('height', function (d) { return m12.bottomheight-m12.pad - m12.y(d.value); });
				
			
	//d3 update	when we select another municipality		
	rects.style('fill', function (d){ return m12.municipalitiesobject[ d.cartoid.slice(2)].color})
		.attr('x', function (d,i) { return m12.x(i); })
		.attr('width', m12.x.rangeBand())
		.transition()
		.delay(function (d,i) { return i*5; })
		.duration(800)
		.style('fill', function (d){ return m12.municipalitiesobject[ d.cartoid.slice(2)].color})
		.attr('y', function (d) {
			//console.log(d.value,d.name) ; 
			return m12.y(d.value); })
		.attr('height', function (d) { return m12.bottomheight-m12.pad - m12.y(d.value); });
	
	//d3 exit()														
	rects.exit().remove();
	
	
	//d3 selection for the text on top of the bar
	var bartext = d3.select("#d3emigration").select('svg').selectAll('bartext').data(data);
	//d3 enter for the text on top of the bar
	bartext.enter().append("text")
		  .attr('x', function (d,i) { return m12.x(i); })
		  .transition()
		  .delay(function (d,i) { return i*5; })
		  .duration(800)
		  .attr('y', function (d) {
			//console.log(d.value,d.name) ; 
			return m12.y(d.value); })
		  .attr("dx", +5)
		  .text(function (d) {return d.value});
		  
	//d3 update for the text on top of the bar	 	
	var bartext = d3.select("#d3emigration").select('svg').selectAll('text').data(data);
	bartext.attr('x', function (d,i) { return m12.x(i); })
		  .transition()
		  .delay(function (d,i) { return i*5; })
		  .duration(800)
		  .attr('y', function (d) {
			//console.log(d.value,d.name) ; 
			return m12.y(d.value); })
		  .attr("dx", +5)
		  .text(function (d) {return d.value; });
		  
	//d3 exit for the text on top of the bar	 	
	bartext.exit().remove();
		
	
	//text labels to put below the x axis
	//I don't use 'text' because it would select the axis tick text	
	var provincestext = d3.select("#d3emigration").select('svg').selectAll('provincestext').data(data);  
	
	//only the enter is enough because the text will not change
	provincestext.enter()
	.append('text')
	.attr('x', function (d,i) { return m12.x(i); })
	.text( function(d){ return d.name})
	.attr('y', function (d) { return m12.bottomheight-m12.pad;})
	.attr( "transform",function (d,i ) { return "rotate(30 " + m12.x(i) + ","+ m12.bottomheight +" )"});
	
	
	//bind a single datum to define a bar chart title
	var helptext = d3.select("#d3emigration").select('svg').datum(m12.municipalitiesobject[ gid.slice(2)]);
	helptext.append("text")
		  .attr("id", 'histotext')
		  .attr('x', '5px')
		  .attr('y', '10px')
		  .text(function(d){ var t;  (m12.toTarget == true) ? t =  d.name + ' emigration': t =  d.name + ' immigration'; return t;});		
}  */

////////////////following are all the functions used to convert data between different formats//////////////////////

// convert a an array of objects into an object where the key is the object id
//this will be used to store a nested object for the municipalities (key is the polygon cartoid, value is the object ) 
m12.toObject = function(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i)
    rv[arr[i].id] = arr[i];
  return rv;
}

// convert the matrix array into an object where the key the object ID
m12.toObject2 = function(matrix){
  var rv = {};
  for (var i = 0; i < matrix.length; ++i)
	{rv[m12.municipalities[i].id] = matrix[i];}
  return rv;		
}

//create dictionary that links cartoid with the ordered index
//this will be used to link the polygon cartoid to the location of the municipality in the matrix
m12.cartoIdToOrdered = function(array){
	var rv = {};
	for (var i = 0; i < array.length; ++i)
		{rv[array[i].id] = i;}
	return rv;			
}

//transpose a matrix
m12.transpose = function(array){ 
	array[0].map(function(col, i) { 
	  return array.map(function(row) { 
		return row[i] 
	  })
	});
}

//in place conversion matrix of strings to matrix of numbers
m12.stringToNumber = function(matrix){
	for (var i=0, l = matrix.length;i<l;i++){ 
		matrix[i]= matrix[i].map(Number);
	}
}

//create a nested object to store the source/target municipalities
m12.setlinkedmunicipalities = function(matrix){
  var rv = {};
  for (var i = 0; i < m12.municipalities.length; ++i){
    rv['id'+m12.municipalities[i].id] = new Array();
	for (var j = 0; j < matrix[i].length; ++j){		
		rv['id'+m12.municipalities[i].id].push( {'cartoid' : 'id'+m12.municipalities[j].id, 'value' : matrix[i][j], 'name' : m12.municipalities[j].name});
		}
	}
  return rv;		
}