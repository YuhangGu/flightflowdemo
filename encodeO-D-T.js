/**
 * Created by Aero on 23/09/2016.
 */
//console.log("This will encode the cooridinate\n");

var fs = require('fs');
var fsairlines = require('fs');
var fswirting = require('fs');
var airpots;

var ODMapindex = new Map();
var m_count=  0;

fs.readFile('data/airport.json', 'utf8', function (err, airportdata) {
    //console.log(airportdata);

    if (err) throw err;
    airpots = JSON.parse(airportdata);
    var airpot_dict = {};

    airpots.forEach( function(d){
        var code = "NULL"
        code = d.code;
        var position = {
            "name" : d.airport_name,
            "country" : d.country,
            "geometry" : [d.longitude,d.latitude],
        };
        airpot_dict[code] = position;
        ODMapindex[d.country] = m_count++;
    });

    var idencode = 0;

    fsairlines.readFile('data/flightdata.json', 'utf8', function(err, flightlinedata){
        //console.log(flightlinedata);

        //console.log("dODMapindex", ODMapindex);
        var ODMatrix = []
        for (var i = 0; i < m_count; i++)
        {
            var thisD = [];
            for(var j = 0; j < m_count; j ++)
            {
                var thisyear = [];
                for (var y = 0; y < 13; y++)
                {
                    var day = [0,0,0,0,0,0,0,0,
                                0,0,0,0,0,0,0,0,
                                 0,0,0,0,0,0,0,0]
                    thisyear.push(day);
                }

                thisD.push(thisyear);
            }
            ODMatrix.push(thisD);
        }

        //console.log("ODMatrix", ODMatrix);

        var flights = JSON.parse(flightlinedata);

        var flowlist = [];

        flights.forEach(function (d){
            var origin = d.origin;
            var destination = d.dest;
            var seats_1, seats_2;

            if(d.seats_1)
            {
                seats_1  = parseInt(d.seats_1);
            }
            else
            {
                seats_1 = 0;
            }

            if(d.seats_2)
            {
                seats_2  = parseInt(d.seats_2);
            }
            else
            {
                seats_2 = 0;
            }

            var hub;

            if(d.hub == null)
            {
                //console.log("hahaha there is no hub");
                //console.log(" hub,seats_2,deptime_2,arrtime_2, elapsedtime_2\n",d.hub,seats_2,d.deptime_2,d.arrtime_2, d.elapsedtime_2);
                var flow = {
                    "type" : "Feature",
                    "properties" : {
                        "id" : idencode++,
                        "year" : d.year,
                        "origin" : origin,
                        "destination" : destination,
                        "origin_city" :airpot_dict[origin].name,
                        "destination_city" :airpot_dict[destination].name,
                        "origin_country" :airpot_dict[origin].country,
                        "destination_country" :airpot_dict[destination].country,
                        "seats_1" : seats_1,
                        "deptime_1" : d.deptime_1,
                        "arrtime_1" : d.arrtime_1,
                        "elapsedtime_1" : d.elapsedtime_1,
                        "hub" : null,
                        "seats_2" : null,
                        "deptime_2" : null,
                        "arrtime_2" : null,
                        "elapsedtime_2" : null
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [parseInt(airpot_dict[origin].geometry[0]),parseInt(airpot_dict[origin].geometry[1])],
                            [parseInt(airpot_dict[destination].geometry[0]),parseInt(airpot_dict[destination].geometry[1])],
                        ]
                    }

                };
            }
            else
            {
                //console.log("look! hubs");
                //console.log(" hub,seats_2,deptime_2,arrtime_2, elapsedtime_2\n",d.hub,seats_2,d.deptime_2,d.arrtime_2, d.elapsedtime_2);
                var flow = {
                    "type" : "Feature",
                    "properties" : {
                        "id" : idencode++,
                        "year" : d.year,
                        "origin" : origin,
                        "destination" : destination,
                        "origin_city" :airpot_dict[origin].name,
                        "destination_city" :airpot_dict[destination].name,
                        "origin_country" :airpot_dict[origin].country,
                        "destination_country" :airpot_dict[destination].country,
                        "seats_1" : seats_1,
                        "deptime_1" : d.deptime_1,
                        "arrtime_1" : d.arrtime_1,
                        "elapsedtime_1" : d.elapsedtime_1,
                        "hub" : d.hub,
                        "hub_city" : airpot_dict[d.hub].name,
                        "seats_2" : seats_2,
                        "deptime_2" : d.deptime_2,
                        "arrtime_2" : d.arrtime_2,
                        "elapsedtime_2" : d.elapsedtime_2
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [parseInt(airpot_dict[origin].geometry[0]),parseInt(airpot_dict[origin].geometry[1])],
                            [parseInt(airpot_dict[d.hub].geometry[0]),parseInt(airpot_dict[d.hub].geometry[1])],
                            [parseInt(airpot_dict[destination].geometry[0]),parseInt(airpot_dict[destination].geometry[1])],
                        ]
                    }

                };
            }

            flowlist.push(flow);

            if(idencode == 100)
            {
                //console.log(flowlist);
               // console.log(flow.geometry.coordinates);
            }

        });

        //console.log("this airports are", airpot_dict);

        var allflows = {
            "type": "FeatureCollection",
            "metadata": {
                "generated": 1
            },
            "features": flowlist
        }

        //console.log("allflows",allflows);


        fswirting.writeFile('data/O-D-Tflows.json', JSON.stringify(allflows, null, 4), function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("JSON saved\n");
            }
        });

    });




});


