/**
 * Created by Aero on 09/03/2017.
 */

var graphics2D = {
    //ID & configurations
    divID           : "#migration-flowmap-2D",
    divIDchord      : "#chord-chart-migration",
    color           : d3.scaleOrdinal([ "#beb9d9","#fe8173","#b1df71","#fecde5","#ffffb8","#feb567","#8ad4c8","#7fb0d2"])
                       .domain(["Capital","East","Northeast","Northwest","South","Southwest","West","Westfjords"]),
    map_width       : $("#migration-flowmap-2D").width(),
    map_height      : 400,

    //graphic elements
    svg_migration2D : null,    // parent
    g_basemap2D     : null,
    g_flows2D       : null,
    className2Dflows: "flows2D",

    svg_chord       : null,
    g_chord         : null,
    arc             : null,
    ribbon          : null,
    classNameChord  : "chord",

    //cartography
    projection      : null,
    linerValueScale : null,
    mapscale        : 9000,
    icelandCenter   : [-18.5747641, 64.8865678],

    //util & settings
    zoom            : null,
    //data utilities
    cityCenterLocations       : d3.map()
}

//--------------- main ---------------
function visualizeIn2D(){

    initializeFlowmap();
    initializeNonGeoGraphics();
}

//--------------- init flowmap ------------------
function initializeFlowmap(){
    var max_overall = [];
    migrationmatrix.forEach(function(d,i){
        if(i!=0){
            max_overall.push(d3.max(d));
        }
    });

    graphics2D.linerValueScale = d3.scaleLinear().domain([0,d3.max(max_overall)]).range([0,10]);

    //initiate
    graphics2D.projection = d3.geo.stereographic()
        .scale(graphics2D.mapscale)
        .center(graphics2D.icelandCenter)
        .translate([graphics2D.map_width/2, graphics2D.map_height / 2])
        .rotate([0, 0])
        .clipAngle(180 - 1e-4)
        .clipExtent([[0, 0], [graphics2D.map_width, graphics2D.map_height]])
        .precision(.1);

    graphics2D.svg_migration2D = d3.select(graphics2D.divID).append("svg")
        .attr("width", graphics2D.map_width)
        .attr("height", graphics2D.map_height)
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + graphics2D.map_width/2 +"," + graphics2D.map_height/2 + ")");

    // interaction
    graphics2D.zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    graphics2D.svg_migration2D.append("rect")
        .attr("class", "overlay")
        .attr("width", graphics2D.map_width)
        .attr("height", graphics2D.map_height)
        .call(graphics2D.zoom);


    graphics2D.g_basemap2D = graphics2D.svg_migration2D.append("g").attr("class","basemap");

    graphics2D.g_flows2D = graphics2D.svg_migration2D.append("g");

    draw2DBasemap();
    drawFlowsOn2DMap(1);
}

function draw2DBasemap(){

    var path = d3.geo.path().projection(graphics2D.projection);

    graphics2D.g_basemap2D.selectAll("path")
        .data(dataIcelandGeo)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", function(d,i){
            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if(index != -1){
                name = name.substr(0,index);
            }
            return graphics2D.color(name);
        })
        .attr("name",function(d,i){

            var name = d.properties.VARNAME_1;
            var index = name.indexOf("|");
            if(index != -1){
                name = name.substr(0,index);
            }
            return name;
        })
        .on("click", function (){
            selectedCity = d3.select(this).attr("name");

            if(lastSelectedCity != selectedCity){

                lastSelectedCity = selectedCity;
                updateVisualizations(selectedCity);
            }
        });

    d3.selectAll("path").each(function(d,i){
        var center = path.centroid(d);
        var named = d3.select(this).attr("name");
        //record the center of path
        graphics2D.cityCenterLocations[named] = center;
        graphics2D.g_basemap2D.append("text")
            .attr("x",center[0])
            .attr("y",center[1])
            .attr("class", "label")
            .text( named );

    });
}

function _abbabden_drawFlowsOn2DMap(){

    migrationmatrix.forEach(function(d,i){

        var point_o = graphics2D.cityCenterLocations[citynameIndexMap[i]];

        citynameIndexMap.forEach(function(name_d){
            var point_d = graphics2D.cityCenterLocations[name_d];
            var i = citynameIndexMap.indexOf(name_d);

            //console.log("point_o,",point_o, "point_d",point_d);
            graphics2D.g_flows2D.append('g')
                .append("line")
                .attr("x1", point_o[0])
                .attr("y1", point_o[1])
                .attr("x2", point_d[0])
                .attr("y2", point_d[1])
                .attr("stroke-width", graphics2D.linerValueScale(d[i]))
                .attr("class",graphics2D.className2Dflows);

        });
    });
}

function drawFlowsOn2DMap(index){
    var bezierLine = d3.svg.line()
        .x(function(d) { return d[0]; })
        .y(function(d) { return d[1]; })
        .interpolate("basis");

    migrationmatrix.forEach(function(d,i){

        var point_o = graphics2D.cityCenterLocations[citynameIndexMap[i]];

        citynameIndexMap.forEach(function(name_d){
            var point_d = graphics2D.cityCenterLocations[name_d];
            var j = citynameIndexMap.indexOf(name_d);

            if( drawingallSwith || i == index || j == index){
                if(i != j){
                    //console.log(i,"==>",j,":",d[j]);

                    //draw striaght line
                    /*
                    graphics2D.g_flows2D.append('g')
                        .append("line")
                        .attr("x1", point_o[0])
                        .attr("y1", point_o[1])
                        .attr("x2", point_d[0])
                        .attr("y2", point_d[1])
                        .attr("stroke-width", graphics2D.linerValueScale(d[j]))
                        .attr("class",graphics2D.className2Dflows);
                        */

                    graphics2D.g_flows2D.append('g')
                        .append('path')
                        .attr("d", function(){
                            var b;
                            if(j>i) {b = -1;}
                            else if(j<i) {b = 1;}

                            var p0 = point_o, p2 = point_d;
                            var p1 = interplayPoint( p0,p2,b );
                            return bezierLine([p0,p1, p2])
                        })
                        .attr("stroke-width", graphics2D.linerValueScale(d[j]))
                        .attr("class",graphics2D.className2Dflows);

                }
            }

        });

    });
    function interplayPoint(p1, p2 , b){

        var x1 = p1[0], y1 = p1[1],
            x2 = p2[0], y2 = p2[1];

        var x3 = x1*3/4 + x2/4, y3 = y1*3/4 + y2/4;
        var k = (y2-y1)/(x2-x1);
        var l_raw = (y2-y1)*(y2-y1) + (x2-x1)* (x2-x1);
        var l = Math.sqrt(l_raw)/4;
        // x4 = x3 +/- ()
        // y4 = y3 +/- ()
        var x4 = x3 - b*k*l/Math.sqrt(1+k*k);

        var y4 = y3 + b*l/Math.sqrt(1+k*k);
        var p = [x4,y4];
        return p;
    }
}

//--------------- init nonGeo ------------------
function initializeNonGeoGraphics(){

    var map_width = $(graphics2D.divIDchord).width();
    var map_height = 400;

    graphics2D.svg_chord = d3.select(graphics2D.divIDchord).append("svg")
        .attr("id", "svg_chord")
        .attr("width", map_width)
        .attr("height", map_height);

    var margin = {top: 30, right: 30, bottom: 10, left: 30},
        width = + graphics2D.svg_chord.attr("width") - margin.left - margin.right,
        height = + graphics2D.svg_chord.attr("height") - margin.top - margin.bottom;

    var innerRadius = height/2.2;
    var outerRadius = height/2;

    graphics2D.arc = d3.arc().innerRadius(innerRadius)
        .outerRadius(outerRadius);

    graphics2D.ribbon = d3.ribbon()
        .radius(innerRadius);

    graphics2D.g_chord = graphics2D.svg_chord.append("g")
        .attr("transform", "translate(" + map_width / 2 + "," + map_height / 2 + ")");

    drawChordMigration();
}

function drawChordMigration(){

    var chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    graphics2D.g_chord.datum(chord(migrationmatrix));

    var group = graphics2D.g_chord.append("g")
        .attr("class", "groups")
        .selectAll("g")
        .data(function(chords) {
            return chords.groups;
        })
        .enter().append("g");

    var chordPath = group.append("path")
        .style("fill", function(d) { return graphics2D.color(d.index); })
        .style("stroke", function(d) { return d3.rgb(graphics2D.color(d.index)).darker(); })
        .attr("class","arcs")
        .attr("d", graphics2D.arc)
        .attr("id", function(d){
            return "ID" + d.index;
        })
        .on("click", function (d){
            selectedCity = citynameIndexMap[d.index];
            console.log("selectedCity: ",selectedCity);
            if(lastSelectedCity != selectedCity){
                console.log("lastSelectedCity: ",lastSelectedCity);
                lastSelectedCity = selectedCity;
                updateVisualizations(selectedCity);
            }
        });

    graphics2D.g_chord.append("g")
        .attr("id", "chordRibbonGourp")
        .selectAll("path")
        .data(function(chords) {
            return chords;
        })
        .enter().append("path")
        .attr("d", graphics2D.ribbon)
        .attr("class", "ribbons")
        .attr("source", function(d){
            return d.source.index;
        })
        .attr("target", function(d){
            return d.target.index;
        })
        .style("fill", function(d) {
            return graphics2D.color(d.source.index); })
        .style("stroke", function(d) { return d3.rgb(graphics2D.color(d.target.index)).darker(); });

    drawlabels();
    function drawlabels(){
        chordPath.each(function(d,i){
            //Search pattern for everything between the start and the first capital L
            var firstArcSection = /(^.+?)L/;
            //Grab everything up to the first Line statement
            var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
            //Replace all the commas so that IE can handle it
            newArc = newArc.replace(/,/g , " ");

            //If the end angle lies beyond a quarter of a circle (90 degrees or pi/2)
            //flip the end and start position
            if ( d.endAngle > Math.PI/2 && d.endAngle  < 3*Math.PI/2 && d.startAngle !=0) {
                var startLoc 	= /M(.*?)A/,		//Everything between the capital M and first capital A
                    middleLoc 	= /A(.*?)0 0 1/,	//Everything between the capital A and 0 0 1
                    endLoc 		= /0 0 1 (.*?)$/;	//Everything between the 0 0 1 and the end of the string (denoted by $)
                //Flip the direction of the arc by switching the start and end point (and sweep flag)
                var newStart = endLoc.exec( newArc )[1];
                var newEnd = startLoc.exec( newArc )[1];
                var middleSec = middleLoc.exec( newArc )[1];
                //Build up the new arc notation, set the sweep-flag to 0
                newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
            }//if

            //Create a new invisible arc that the text can flow along
            group.append("path")
                .attr("class", "hiddenDonutArcs")
                .attr("id", "donutArc"+i)
                .attr("d", newArc)
                .style("fill", "none");

        });

        group.append("text")
            .attr("class", "chordlabel")
            //.attr("dy", -10)
            .attr("dy", function(d,i) {

                if(d.endAngle > Math.PI/2 && d.endAngle < 3*Math.PI/2 && d.startAngle !=0)
                {
                    return 17;
                }
                else
                {
                    return -11;
                }
            })
            .append("textPath")
            .attr("startOffset","50%")
            .attr("xlink:href",function(d,i){return "#donutArc"+i;})
            .text(function(d){return citynameIndexMap[d.index]; });

    }

}

function _abandon_drawChordMigration(){
    var map_width = $(graphics2D.divIDchord).width();
    var map_height = 400;
    graphics2D.svg_chord = d3.select(graphics2D.divIDchord).append("svg")
        .attr("id", "svg_chord")
        .attr("width", map_width)
        .attr("height", map_height);

    var margin = {top: 30, right: 30, bottom: 10, left: 30},
        width = + graphics2D.svg_chord.attr("width") - margin.left - margin.right,
        height = + graphics2D.svg_chord.attr("height") - margin.top - margin.bottom;

    var chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    var innerRadius = height/2.2;
    var outerRadius = height/2;

    var arc = d3.arc().innerRadius(innerRadius)
        .outerRadius(outerRadius);

    var ribbon = d3.ribbon()
        .radius(innerRadius);

    graphics2D.g_chord = graphics2D.svg_chord.append("g")
        .attr("transform", "translate(" + map_width / 2 + "," + map_height / 2 + ")")
        .datum(chord(migrationmatrix));

    var chordmatrix;

    var group = graphics2D.g_chord.append("g")
        .attr("class", "groups")
        .selectAll("g")
        .data(function(chords) {
            chordmatrix = chords.groups;
            return chords.groups;
        })
        .enter().append("g");

    var chordPath = group.append("path")
        .style("fill", function(d) { return graphics2D.color(d.index); })
        .style("stroke", function(d) { return d3.rgb(graphics2D.color(d.index)).darker(); })
        .attr("d", arc)
        .attr("id", function(d){
            return "ID" + d.index;
        });

    //$("#migration-flowmap-3D").trigger("draw3DmigrationMap", [migrationmatrix, citynameIndexMap]);

    chordPath.each(function(d,i){
        //Search pattern for everything between the start and the first capital L
        var firstArcSection = /(^.+?)L/;
        //Grab everything up to the first Line statement
        var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
        //Replace all the commas so that IE can handle it
        newArc = newArc.replace(/,/g , " ");

        //If the end angle lies beyond a quarter of a circle (90 degrees or pi/2)
        //flip the end and start position
        if ( d.endAngle > Math.PI/2 && d.endAngle  < 3*Math.PI/2 && d.startAngle !=0) {
            var startLoc 	= /M(.*?)A/,		//Everything between the capital M and first capital A
                middleLoc 	= /A(.*?)0 0 1/,	//Everything between the capital A and 0 0 1
                endLoc 		= /0 0 1 (.*?)$/;	//Everything between the 0 0 1 and the end of the string (denoted by $)
            //Flip the direction of the arc by switching the start and end point (and sweep flag)
            var newStart = endLoc.exec( newArc )[1];
            var newEnd = startLoc.exec( newArc )[1];
            var middleSec = middleLoc.exec( newArc )[1];
            //Build up the new arc notation, set the sweep-flag to 0
            newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
        }//if

        //Create a new invisible arc that the text can flow along
        group.append("path")
            .attr("class", "hiddenDonutArcs")
            .attr("id", "donutArc"+i)
            .attr("d", newArc)
            .style("fill", "none");

    });

    // these are for the ribbon
    graphics2D.g_chord.append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(function(chords) { return chords; })
        .enter().append("path")
        .attr("d", ribbon)
        .style("fill", function(d) {
            return graphics2D.color(d.source.index); })
        .style("stroke", function(d) { return d3.rgb(graphics2D.color(d.target.index)).darker(); });

    //Append the label names on the outside
    group.append("text")
        .attr("class", "chordlabel")
        //.attr("dy", -10)
        .attr("dy", function(d,i) {

            if(d.endAngle > Math.PI/2 && d.endAngle < 3*Math.PI/2 && d.startAngle !=0)
            {
                return 17;
            }
            else
            {
                return -11;
            }
        })
        .append("textPath")
        .attr("startOffset","50%")
        .attr("xlink:href",function(d,i){return "#donutArc"+i;})
        .text(function(d){return citynameIndexMap[d.index]; });

}

//--------------- utilities ------------------
function zoomed() {
    graphics2D.g_basemap2D.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    graphics2D.g_basemap2D.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");
    graphics2D.g_flows2D.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    graphics2D.g_flows2D.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");
}

