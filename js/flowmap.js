$(document).ready(function(){

    $("#morris-area-chart").hide();

    var flowmap =  $("#flowmap");

    var map_width = 600, map_height = 600;

    var projection = d3.geo.azimuthalEquidistant()
        .scale(150)
        .translate([map_width / 2, map_height / 2])
        .clipAngle(180 - 1e-3)
        .precision(.1);

    //Define path generator
    var path = d3.geo.path().projection(projection);

    var svg = d3.select("#flowmap").append("svg")
        .attr("width", map_width)
        .attr("height", map_height).append("g")
        .attr("transform", "rotate(0,180,180)")
        .attr("transform", "translate(" + (-30)+"," + 50 + ")");

    var g_basemap = svg.append("g")
        .attr("class","basemap");

    drawBaseMap();

    function drawBaseMap() {

        d3.json("../data/world-110m.json", function (error, world) {

            g_basemap.append("path", ".circle")
                .datum(topojson.object(world, world.objects.land))
                .attr("class", "land")
                .attr("d", path);
        });

    }

});