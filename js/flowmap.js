
//storing the frequency of in-outgoing flights
var frequency_hourly_d = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,];
var frequency_hourly_a = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,];
var matrix_list_24 =   [];



$(document).ready(function(){

    // define the base map
    var map_width = $("#flow-map").width();
    var map_height = 700;

    var projection = d3.geo.azimuthalEquidistant()
        .scale(150)
        .translate([map_width / 2, map_height / 2])
        .clipAngle(180 - 1e-3)
        .precision(.1);

    //Define path generator
    var path = d3.geo.path().projection(projection);

    var svg = d3.select("#flow-map").append("svg")
        .attr("id","svg_flow")
        .attr("width", map_width)
        .attr("height", map_height)
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + (-30)+"," + 50 + ")");

    var g_basemap = svg.append("g")
        .attr("class","basemap");

    var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 8])
        .on("zoom", zoomed);


    var g_arcflows = svg.append("g").attr("id","group_flow");

    //-----------working processing--------

    drawBaseMap();
    drawAirLines();

    //-------------------------definition-------------------------

    function drawAirLines(  ) {

        d3.json("../data/arrivalflows.json", function (flights) {

            //matrix_list_24;

            var bezierLine = d3.svg.line()
                .x(function(d) { return d[0]; })
                .y(function(d) { return d[1]; })
                .interpolate("basis");

            g_arcflows.selectAll("arc")
                .data(flights.features)
                .enter()
                .append('path')
                .attr("d", function(d){
                    var b;
                    if(d.properties.origin == "KEF") {b = -1;}
                    else if(d.properties.destination == "KEF") {b = 1;}
                    var p0 = projection(d.geometry.coordinates[0]), p2 = projection(d.geometry.coordinates[1]);
                    var p1 = interplayPoint( p0,p2,b );
                    return bezierLine([p0,p1, p2])
                })
                .attr("id", function(d){
                    //console.log("flow_id_" + d.properties.hour);
                    //return "flow_id_" + d.properties.hour;

                    if(d.properties.origin == "KEF") {
                        return "flow_depature_id_" + d.properties.hour;
                    }
                    else if(d.properties.destination == "KEF") {
                        return "flow_arrival_id_" + d.properties.hour;
                    }


                })
                .attr("class", function(d){
                    if(d.properties.origin == "KEF") {return "flow_depature";}
                    else if(d.properties.destination == "KEF") {return "flow_arrival";}
                });

            /*
            g_flows.selectAll("line")
                .data(flights.features)
                .enter()
                .append("line")
                .attr("x1", function(d) { return projection(d.geometry.coordinates[0])[0];  })
                .attr("y1", function(d) { return projection(d.geometry.coordinates[0])[1];  })
                .attr("x2", function(d) { return projection(d.geometry.coordinates[1])[0];  })
                .attr("y2", function(d) { return projection(d.geometry.coordinates[1])[1];  })
                .attr("class", function(d){
                    if(d.properties.origin == "KEF")
                    {
                        return "flow_depature";
                    }
                    else if(d.properties.destination == "KEF")
                    {
                        return "flow_arrival";
                    }
                });
                */

            //read the data to create frequency array
            flights.features.forEach( function(d){

                // depature is KEF
                if(d.properties.origin == "KEF"){
                    var index = parseInt(d.properties.hour, 10);
                    frequency_hourly_d[index]++;
                }
                else if(d.properties.destination == "KEF")
                {
                    var index = parseInt(d.properties.hour, 10);
                    frequency_hourly_a[index]++;
                }


            });

            //console.log("frequency_hourly_d ",frequency_hourly_d);
            //console.log("frequency_hourly_a ",frequency_hourly_a);
            drawBarChart();
            drawChordChart();

        });

        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", map_width)
            .attr("height", map_height)
            .call(zoom);
    }

    function drawBaseMap() {

        d3.json("../data/world-110m.json", function (error, world) {
            g_basemap.append("path", ".circle")
                .datum(topojson.object(world, world.objects.land))
                .attr("class", "basemap")
                .attr("d", path);
        });

    }


    function zoomed() {
        g_basemap.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g_basemap.select(".basemap").style("stroke-width", .5 / d3.event.scale + "px");
        //g_flows.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        //g_flows.select(".flow").style("stroke-width", .5 / d3.event.scale + "px");
        g_arcflows.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g_arcflows.select(".flow").style("stroke-width", .5 / d3.event.scale + "px");

    }

    d3.select(self.frameElement).style("height", height + "px");

});


//_____________definitions_____________

function drawBarChart(){

    var map_width = $("#bar-chart-iceland").width();
    var map_height = 300;

    var svg = d3.select("#bar-chart-iceland").append("svg")
        .attr("id", "barchart")
        .attr("width", map_width)
        .attr("height", map_height);

    var margin = {top: 30, right: 30, bottom: 10, left: 30},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var g_depature = svg.append("g").attr("transform", "translate(" + map_width/2+ "," + margin.top + ")");
    var g_arrival = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var g_labels = svg.append("g").attr("transform", "translate(" + 0 + "," + margin.top + ")");
    var g_legend = svg.append("g").attr("transform", "translate(" + 0 + "," + margin.top + ")");

    width = width/2;

    // top -- down graphic
    var y = d3.scaleBand().domain(frequency_hourly_d.map(function(d,i){return i;})).range([0, height])
        .paddingInner(0.3);
    var max_d = d3.max(frequency_hourly_d);
    var max_a = d3.max(frequency_hourly_a);
    var x = d3.scaleLinear().domain([0, d3.max([max_a,max_d])]).range([0, width]);

    //drawing bar chart for depature
    var color_last;

    var bar_depature = g_depature.selectAll(".bar")
        .data(frequency_hourly_d)
        .enter().append("rect")
        .attr("class","bar_depature")
        .attr("y", function(d,i){
            return y(i);
        })
        .attr("width", function(d,i){
            return x(d);
        })
        .attr("height", y.bandwidth())
        .attr("transform", function(d){
            var k = margin.right/3;
            return "translate(" + k  + "," + 0 + ")"
        })
        .on("mouseover", function (d,i) {

            color_last = d3.select(this).style("fill");
            //console.log("color",color_last);
            d3.select(this).style("fill", "#ffff00");

            var x = d3.select(this).attr("x");
            var width_x = d3.select(this).attr("width") ;
            var y = d3.select(this).attr("y");
            var width_y = d3.select(this).attr("height");

            g_depature.append("text")
                .attr("class", "label_temp")
                .attr("x", x)
                .attr("y", y)
                .attr("transform", "translate(" + width_x + "," + width_y + ")")
                .text(d);

        })
        .on("mouseout", function (d,i) {
            d3.select(this).style("fill", color_last);
            g_depature.selectAll(".label_temp").remove();
        });

    //drawing bar chart for arrival
    var bar_arrival = g_arrival.selectAll(".bar")
        .data(frequency_hourly_a)
        .enter().append("rect")
        .attr("class","bar_arrival")
        .attr("y", function(d,i){
            return y(i);
        })
        .attr("width", function(d,i){
            return x(d);
        })
        .attr("height", y.bandwidth())
        .attr("transform", function(d){
            var k = width - x(d) -margin.right/3;
            return "translate(" + k  + "," + 0 + ")"
        })
        .on("mouseover", function (d,i) {

            color_last = d3.select(this).style("fill");
            //console.log("color",color_last);
            d3.select(this).style("fill", "#ffff00");

            var x = d3.select(this).attr("x");
            var width_x = d3.select(this).attr("width") ;
            var y = d3.select(this).attr("y");
            var width_y = d3.select(this).attr("height");


            //console.log("x,y", x, y);
            g_arrival.append("text")
                .attr("class", "label_temp")
                .attr("y", y)
                .attr("transform", "translate(" + (width - width_x )+ "," + width_y + ")")
                .text(d);


        })
        .on("mouseout", function (d,i) {
            d3.select(this).style("fill", color_last);
            g_arrival.selectAll(".label_temp").remove();
        });


    var aixe_labels = g_labels.selectAll(".label")
        .data(frequency_hourly_a).enter().append("text")
        .attr("class","label")
        .attr("x", map_width/2)
        .attr("y",function(d,i){
            return y(i) + y.bandwidth()/2;
        })
        .text( function(d, i){
            return i ;
        })
        .attr("height",y.bandwidth())
        .on("mouseover", function (d,i) {
            color_last = d3.select(this).style("fill");
            d3.select(this).style("fill", "#ffff00");

        })
        .on("mouseout", function (d,i) {
            d3.select(this).style("fill", color_last);

        })
        .on("click", function(d, i){
            var idnum = d3.select(this).text();

            var g = d3.select("#flow-map").select("#svg_flow").select("#group_flow");

            // flow_depature_id_
            //var gg = $("#group_flow");
            //console.log( g , "\n",gg);
            g.selectAll(".flow_depature").attr("class", "flow_depature_gone");
            g.selectAll(".flow_arrival").attr("class", "flow_arrival_gone");

            g.selectAll( "#flow_depature_id_" + idnum).attr("class","flow_depature" );
            g.selectAll( "#flow_arrival_id_" + idnum).attr("class","flow_arrival" );
           // g_arcflows.select("#" + string).attr();

        });

    g_legend.append("text")
        .attr("class","label_legend")
        .attr("x", map_width/4*3)
        .attr("y", -margin.bottom)
        .attr("fill",  " #46b39d")
        .text("depature");
    g_legend.append("text")
        .attr("class","label_legend")
        .attr("x", map_width/4)
        .attr("y", -margin.bottom)
        .attr("fill",  " #c3a130")
        .text("arrival");
    g_legend.append("text")
        .attr("class","label_legend")
        .attr("x", map_width/2)
        .attr("y", -margin.bottom)
        .attr("fill",  " #8a8c8d")
        .text("time");

}

function drawChordChart(){
    var map_width = $("#chord-chart-iceland").width();
    var map_height = 300;

    var svg = d3.select("#chord-chart-iceland").append("svg")
        .attr("id", "text_test")
        .attr("width", map_width)
        .attr("height", map_height);

    var margin = {top: 30, right: 30, bottom: 10, left: 30},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;



    d3.json("../data/matrix.json", function(err, data){

        var matrix = data.matrix;

        var maxlist = [];
        matrix.forEach(function(d,i){
            maxlist.push(d3.max(d));
        });

        var chord = d3.chord()
            .padAngle(0.005)
            .sortSubgroups(d3.descending);

        //console.log("chord", chord(matrix));

        var innerRadius = height/2.2;
        var outerRadius = height/2;
        var formatValue = d3.formatPrefix(",.0", 1e3);

        var arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        var ribbon = d3.ribbon()
            .radius(innerRadius);

        var color = d3.scaleLinear()
            .domain([0,d3.max(maxlist)])
            .range([ "#46b39d","#c3a130"]);


        /*
        var color_airport = d3.scaleOrdinal()
            .domain(maxlist)
            .range(d3.color(maxlist));
        */

        var color_airport = d3.scaleOrdinal(d3.schemeCategory20);


        var g_main = svg.append("g")
            .attr("transform", "translate(" + map_width / 2 + "," + map_height / 2 + ")")
            .datum(chord(matrix));


        var group = g_main.append("g")
            .attr("class", "groups")
            .selectAll("g")
            .data(function(chords) {
                return chords.groups;
            })
            .enter().append("g");

        group.append("path")
            .style("fill", function(d) { return color_airport(d.index); })
            .style("stroke", function(d) { return d3.rgb(color_airport(d.index)).darker(); })
            .attr("d", arc);

        /*
        var groupTick = group.selectAll(".group-tick")
            .data(function(d) { return groupTicks(d, 1e3); })
            .enter().append("g")
            .attr("class", "group-tick")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outerRadius + ",0)"; });

*/

        // these are for the ribbon
        g_main.append("g")
            .attr("class", "ribbons")
            .selectAll("path")
            .data(function(chords) { return chords; })
            .enter().append("path")
            .attr("d", ribbon)
            .style("fill", function(d) {
                return color(d.target.index); })
            .style("stroke", function(d) { return d3.rgb(color(d.target.index)).darker(); });


    });

}

function groupTicks(d, step) {
    var k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, step).map(function(value) {
        return {value: value, angle: value * k + d.startAngle};
    });
}

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





