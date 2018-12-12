/*
 * Created by Aero on 8/2/2018.
 */

L.mapbox.accessToken = 'pk.eyJ1IjoiaXRjYWVybyIsImEiOiJjaWxuZmtlOHQwMDA2dnNseWMybHhvMXh0In0.DObc4iUf1_86LxJGF0RHog';

var Vis = {

    map_center : {lat: 65.067500 , lng: -18.588414},
    map_scale : 5.5,
    dataAirports: null,
    dataLocalFlights: null,
    airPortCodeList : ["AEY", "BIU", "EGS", "GJR", "GRY", "HFN",
        "HZK", "IFJ", "KEF", "RKV", "SAK", "THO", "VEY", "VPN"],

}

function VisInit2D() {

    $("#flowmapQT li").click(function(e)
    {
        var lineType = $(this).text();
        reRrawFlows(lineType);
    });


    dataProcessing( function () {

        reRrawFlows( "link");
    });

}

function dataProcessing(callback) {

    d3.json("../data/icelandlocal.json", function(error, data){


        Vis.dataAirportNames = data.airportsDictionary;
        Vis.dataAirports = data.airportsGeo.map(function (d) {
            return [  parseFloat(d[1])  ,  parseFloat(d[0])  ];
        });
        Vis.dataLocalFlights = data.flights;


    });

    setTimeout(callback, 200);
}



function reRrawFlows(lineType) {

    mapboxgl.accessToken = 'pk.eyJ1IjoiZW5qYWxvdCIsImEiOiJjaWhtdmxhNTIwb25zdHBsejk0NGdhODJhIn0.2-F2hS_oTZenAWc0BMf_uw'

    var map = new mapboxgl.Map({
        container: 'flowmap2D', // container id
        style: 'mapbox://styles/enjalot/cihmvv7kg004v91kn22zjptsc',
        center: [ Vis.map_center.lng, Vis.map_center.lat],
        zoom: Vis.map_scale
    });
    //map.scrollZoom.disable();
    //map.addControl(new mapboxgl.Navigation());

    // Setup our svg layer that we can manipulate with d3
    var container = map.getCanvasContainer()
    var svg = d3.select(container).append("svg")
        .attr("class", "flows2D");

    var d3Projection = getD3();
    var path = d3.geoPath();

    var arr = Vis.dataLocalFlights.map(function (d) {return d3.sum( d.dateweek) });

    var scalelinear = d3.scaleLinear().domain([0, d3.max(arr)] ).range([0, 14]);
    var colorlinear = d3.scaleLinear().domain([0, d3.max(arr)] ).range(["#ffffff",  "#e24d20" ]);

    var sizecolorswitch = 1;

    if(lineType == "width"){
        Vis.flows = svg.selectAll("line")
            .data(Vis.dataLocalFlights).enter().append("line")
            /*
            .attr("x1" ,function (d) {
                return d3Projection(d.originloglat)[0];
            })
            .attr("y1" ,function (d) {
                return d3Projection(d.originloglat)[1];

            })
            .attr("x2" ,function (d) {
                return d3Projection(d.destloglat)[0];

            })
            .attr("y2" ,function (d) {
                return d3Projection(d.destloglat)[1];
            })
            */
            .style("stroke-width", function (d) {
                return scalelinear(d3.sum(d.dateweek));
            })
            .style("stroke", "#2b00ba");
    }
    else if(lineType == "color"){

        Vis.flows = svg.selectAll("line")
            .data(Vis.dataLocalFlights).enter().append("line")
            .style("stroke-width", 4)
            .style("stroke", function (d) {
                return colorlinear(d3.sum(d.dateweek));
            });
    }
    else if(lineType == "link"){
        Vis.flows = svg.selectAll("line")
            .data(Vis.dataLocalFlights).enter().append("line")
            .style("stroke-width", 3)
            .style("stroke", "#dd413b")
            //.style("opacity", 0.6);
    }


    Vis.airports = svg.selectAll("circle").data( Vis.dataAirports )
        .enter().append("circle")
        //.attr('r', 20)
        .attr("class", "airports");

    Vis.airportNames = svg.selectAll("text").data(  Vis.dataAirports )
        .enter().append("text")
        .attr("class", "airportlabel")
        .text( function (d,i) {
            return Vis.dataAirportNames[i];
        });



    map.on("viewreset", function() {
        render()
    })
    map.on("move", function() {
        render()
    })


    render();

    function getD3() {

        //var bbox = document.body.getBoundingClientRect();
        var bbox = document.getElementById("flowmap2D").getBoundingClientRect();

        //var bbox = $("#flowmap2D").getBoundingClientRect();
        var center = map.getCenter();
        var zoom = map.getZoom();
        // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
        var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);

        var d3projection = d3.geoMercator()
            .center([center.lng, center.lat])
            .translate([bbox.width/2, bbox.height/2])
            .scale(scale);

        return d3projection;
    }



    function render() {

        d3Projection = getD3();
        path.projection(d3Projection);
        Vis.flows.attr("x1" ,function (d) {
                return d3Projection(d.originloglat)[0];
            })
            .attr("y1" ,function (d) {
                return d3Projection(d.originloglat)[1];

            })
            .attr("x2" ,function (d) {
                return d3Projection(d.destloglat)[0];

            })
            .attr("y2" ,function (d) {
                return d3Projection(d.destloglat)[1];
            }).attr("stroke-width", 2)
            .attr("stroke", "#2b00ba");

        Vis.airports
            .attr('cx', function (d) {
                //console.log(d);
                return d3Projection(d)[0] ;
            })
            .attr('cy',  function (d) {
                return d3Projection(d)[1];
            })

        Vis.airportNames
            .attr('x',  function (d) {
                return d3Projection(d)[0] ;
            })
            .attr('y',  function (d) {
                return d3Projection(d)[1]+ 16;
            })
    }

}

