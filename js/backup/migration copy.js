/**
 * Created by Aero on 15/02/2017.
 */

var color = d3.scaleOrdinal([ "#beb9d9","#fe8173","#b1df71","#fecde5","#ffffb8","#feb567","#8ad4c8","#7fb0d2"]);
color.domain(["Capital","East","Northeast","Northwest","South","Southwest","West","Westfjords"]);

var citynameIndexMap = [];
var migrationmatrix = [];

function migrationVisStart(e){

    loadIcelandGeoData(function(){
        loadMigrationData( function(){
            init();
        });

    } );

}

function init(){

    var map_width = $("#migration-flowmap").width();
    var map_height = 600;

    var projection = d3.geo.stereographic()
        .scale(10000)
        .center([-18.5747641, 64.8865678])
        .translate([map_width/2, map_height / 2])
        .rotate([0, 0])
        .clipAngle(180 - 1e-4)
        .clipExtent([[0, 0], [map_width, map_height]])
        .precision(.1);

    var svg = d3.select("#migration-flowmap").append("svg")
        .attr("width", map_width)
        .attr("height", map_height)
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + map_width/2 +"," + map_height/2 + ")");


    //var color = d3.scaleOrdinal(d3.schemeCategory20);


    var path = d3.geo.path().projection(projection);


    var g_basemap = svg.append("g")
        .attr("class","basemap");

    var g_flows = svg.append("g");

    var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 8])
        .on("zoom", zoomed);


    var centerMap = d3.map();

    drawBasemap();

    //---------------------function definition------------------//

    function drawFlows(){

        d3.json( "../data/iceland-migration.json",function(data){

            var indexset = new Set(data[0]);

            var max_overall = [];
            data.forEach(function(d,i){
                if(i!=0){
                    max_overall.push(d3.max(d));
                }
            });

            var scale = d3.scaleLinear().domain([0,d3.max(max_overall)]).range([0,10])

            data.forEach(function(d,i){


                if(i!= 0)
                {
                    var name = data[0][i-1];

                    var point_o = centerMap[name];

                    indexset.forEach(function(name_d){


                        var point_d = centerMap[name_d];
                        var i = data[0].indexOf(name_d);
                        g_flows.append('g')
                            .append("line")
                            .attr("x1", point_o[0])
                            .attr("y1", point_o[1])
                            .attr("x2", point_d[0])
                            .attr("y2", point_d[1])
                            .attr("stroke-width", scale(d[i]))
                            .attr("class","flows");

                    });


                }

            });

        });
    }

    function drawBasemap(){

        d3.json("../data/icelandgeo.json", function (error, iceland) {

            g_basemap.selectAll("path")
                .data(iceland.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", function(d,i){
                    var name = d.properties.VARNAME_1;
                    var index = name.indexOf("|");
                    if(index != -1){
                        name = name.substr(0,index);
                    }
                    return color(name);
                })
                .attr("name",function(d){

                    var name = d.properties.VARNAME_1;
                    var index = name.indexOf("|");
                    if(index != -1){
                        name = name.substr(0,index);
                    }
                    return name;
                });;

            d3.selectAll("path").each(function(d,i){
                var center = path.centroid(d);
                var named = d3.select(this).attr("name");

                //record the center of path
                centerMap[named] = center;

                g_basemap.append("text")
                    .attr("x",center[0])
                    .attr("y",center[1])
                    .attr("class", "label")
                    .text( named );

            });

            drawFlows();
            drawChordMigration()
        });



        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", map_width)
            .attr("height", map_height)
            .call(zoom);

    }


    function zoomed() {
        g_basemap.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g_basemap.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");
        g_flows.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g_flows.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");

    }


    function drawChordMigration(){

        var map_width = $("#chord-chart-migration").width();
        var map_height = 400;

        var svg = d3.select("#chord-chart-migration").append("svg")
            .attr("id", "svg_chord")
            .attr("width", map_width)
            .attr("height", map_height);

        var margin = {top: 30, right: 30, bottom: 10, left: 30},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;


        d3.json("../data/iceland-migration.json", function(err, data){

            var matrix = [];

            for(var i = 1; i < data.length; i++){
                matrix.push(data[i]);
            }

            var maxlist = [];

            matrix.forEach(function(d,i){
                maxlist.push(d3.max(d));
            });

            var chord = d3.chord()
                .padAngle(0.05)
                .sortSubgroups(d3.descending);

            var innerRadius = height/2.2;
            var outerRadius = height/2;

            var arc = d3.arc().innerRadius(innerRadius)
                .outerRadius(outerRadius);

            var ribbon = d3.ribbon()
                .radius(innerRadius);

            var g_main = svg.append("g")
                .attr("transform", "translate(" + map_width / 2 + "," + map_height / 2 + ")")
                .datum(chord(matrix));


            var chordmatrix;
            var group = g_main.append("g")
                .attr("class", "groups")
                .selectAll("g")
                .data(function(chords) {
                    chordmatrix = chords.groups;
                    return chords.groups;
                })
                .enter().append("g");

            var chordPath = group.append("path")
                .style("fill", function(d) { return color(d.index); })
                .style("stroke", function(d) { return d3.rgb(color(d.index)).darker(); })
                .attr("d", arc)
                .attr("id", function(d){
                    return "ID" + d.index;
                });


            //past matrix

            $("#migration-flowmap").ready(function(){
                $("#migration-flowmap-3D").trigger("draw3DmigrationMap", [matrix, data[0]]);
            });


            //--------

            chordPath.each(function(d,i){
                //console.log(d);

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
            g_main.append("g")
                .attr("class", "ribbons")
                .selectAll("path")
                .data(function(chords) { return chords; })
                .enter().append("path")
                .attr("d", ribbon)
                .style("fill", function(d) {
                    return color(d.source.index); })
                .style("stroke", function(d) { return d3.rgb(color(d.target.index)).darker(); });

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
                .text(function(d){return data[0][d.index]; });




        });
    }

}


/*

$(document).ready(function(){

    var map_width = $("#migration-flowmap").width();
    var map_height = 600;

    var projection = d3.geo.stereographic()
        .scale(10000)
        .center([-18.5747641, 64.8865678])
        .translate([map_width/2, map_height / 2])
        .rotate([0, 0])
        .clipAngle(180 - 1e-4)
        .clipExtent([[0, 0], [map_width, map_height]])
        .precision(.1);

    var svg = d3.select("#migration-flowmap").append("svg")
        .attr("width", map_width)
        .attr("height", map_height)
        .attr("transform", "rotate(0,180,180)")
       .attr("transform", "translate(" + map_width/2 +"," + map_height/2 + ")");


    //var color = d3.scaleOrdinal(d3.schemeCategory20);


    var path = d3.geo.path().projection(projection);


    var g_basemap = svg.append("g")
        .attr("class","basemap");

    var g_flows = svg.append("g");

    var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 8])
        .on("zoom", zoomed);


    var centerMap = d3.map();

    drawBasemap();

    //---------------------function definition------------------//

    function drawFlows(){


        d3.json( "../data/iceland-migration.json",function(data){

            var indexset = new Set(data[0]);

            var max_overall = [];
            data.forEach(function(d,i){
                if(i!=0){
                    max_overall.push(d3.max(d));
                }
            });

            var scale = d3.scaleLinear().domain([0,d3.max(max_overall)]).range([0,10])

            data.forEach(function(d,i){


                if(i!= 0)
                {
                    var name = data[0][i-1];

                    var point_o = centerMap[name];

                    indexset.forEach(function(name_d){


                        var point_d = centerMap[name_d];
                        var i = data[0].indexOf(name_d);
                        g_flows.append('g')
                            .append("line")
                            .attr("x1", point_o[0])
                            .attr("y1", point_o[1])
                            .attr("x2", point_d[0])
                            .attr("y2", point_d[1])
                            .attr("stroke-width", scale(d[i]))
                            .attr("class","flows");

                    });


                }

            });

        });
    }

    function drawBasemap(){

        d3.json("../data/icelandgeo.json", function (error, iceland) {

            g_basemap.selectAll("path")
                .data(iceland.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", function(d,i){
                    var name = d.properties.VARNAME_1;
                    var index = name.indexOf("|");
                    if(index != -1){
                        name = name.substr(0,index);
                    }
                    return color(name);
                })
                .attr("name",function(d){

                    var name = d.properties.VARNAME_1;
                    var index = name.indexOf("|");
                    if(index != -1){
                        name = name.substr(0,index);
                    }
                    return name;
                });;

            d3.selectAll("path").each(function(d,i){
                var center = path.centroid(d);
                var named = d3.select(this).attr("name");

                //record the center of path
                centerMap[named] = center;

                g_basemap.append("text")
                    .attr("x",center[0])
                    .attr("y",center[1])
                    .attr("class", "label")
                    .text( named );

            });

            drawFlows();
            drawChordMigration()
        });



        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", map_width)
            .attr("height", map_height)
            .call(zoom);



    }


    function zoomed() {
        g_basemap.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g_basemap.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");
        g_flows.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g_flows.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");

    }


    function drawChordMigration(){

        var map_width = $("#chord-chart-migration").width();
        var map_height = 400;

        var svg = d3.select("#chord-chart-migration").append("svg")
            .attr("id", "svg_chord")
            .attr("width", map_width)
            .attr("height", map_height);

        var margin = {top: 30, right: 30, bottom: 10, left: 30},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;


        d3.json("../data/iceland-migration.json", function(err, data){

            var matrix = [];

            for(var i = 1; i < data.length; i++){
                matrix.push(data[i]);
            }

            var maxlist = [];

            matrix.forEach(function(d,i){
                maxlist.push(d3.max(d));
            });

            var chord = d3.chord()
                .padAngle(0.05)
                .sortSubgroups(d3.descending);

            var innerRadius = height/2.2;
            var outerRadius = height/2;

            var arc = d3.arc().innerRadius(innerRadius)
                .outerRadius(outerRadius);

            var ribbon = d3.ribbon()
                .radius(innerRadius);

            var g_main = svg.append("g")
                .attr("transform", "translate(" + map_width / 2 + "," + map_height / 2 + ")")
                .datum(chord(matrix));


            var chordmatrix;
            var group = g_main.append("g")
                .attr("class", "groups")
                .selectAll("g")
                .data(function(chords) {
                    chordmatrix = chords.groups;
                    return chords.groups;
                })
                .enter().append("g");

            var chordPath = group.append("path")
                .style("fill", function(d) { return color(d.index); })
                .style("stroke", function(d) { return d3.rgb(color(d.index)).darker(); })
                .attr("d", arc)
                .attr("id", function(d){
                    return "ID" + d.index;
                });


            //past matrix

            $("#migration-flowmap").ready(function(){
                $("#migration-flowmap-3D").trigger("draw3DmigrationMap", [matrix, data[0]]);
            });


            //--------

            chordPath.each(function(d,i){
                    //console.log(d);

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
            g_main.append("g")
                .attr("class", "ribbons")
                .selectAll("path")
                .data(function(chords) { return chords; })
                .enter().append("path")
                .attr("d", ribbon)
                .style("fill", function(d) {
                    return color(d.source.index); })
                .style("stroke", function(d) { return d3.rgb(color(d.target.index)).darker(); });

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
                .text(function(d){return data[0][d.index]; });




        });
    }
});

*/




