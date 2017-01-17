/**
 * Created by Aero on 23/09/2016.
 */
//console.log("This will encode the cooridinate\n");

var fs = require('fs');
var fsairlines = require('fs');
var fswirting = require('fs');

fsairlines.readFile('data/timeandflow.json', 'utf8', function(err, flightlinedata){
    //console.log(flightlinedata);

    var nodes = [];
    var links = [];

    var flights = JSON.parse(flightlinedata);

    var linksArray = [];
    var map_node_index = new Map();
    var index = 0;


    //format the nodes
    flights.features.forEach(function (d){


        if(! map_node_index.has(d.properties.origin_city) && d.properties.origin_city!= "null"){
            map_node_index.set(d.properties.origin_city , index);

            var tempnode = {
                "name" : d.properties.origin_city
            }
            nodes.push(tempnode);
            index ++;
        }

        //console.log("cityname", cityname);
        if(!map_node_index.has(d.properties.destination_city)  && d.properties.destination_city!= "null" ){
            map_node_index.set(d.properties.destination_city , index);

            var tempnode = {
                "name" : d.properties.destination_city
            }
            nodes.push(tempnode);
            index ++;
        }

        if(d.properties.hub != "null" && d.properties.hub_city!= undefined)
        {
            //console.log("hub", d.properties.hub_city);
            if(!map_node_index.has(d.properties.hub_city))
            {
                map_node_index.set(d.properties.hub_city , index);

                var tempnode = {
                    "name" : d.properties.hub_city
                }
                nodes.push(tempnode);
                index ++;
            }

        }


    });

    var map_line_compute = new Map();
    var count = 0;

    var hubcount = 0;

    flights.features.forEach( function(d){

        var sourcecity = d.properties.origin_city;
        var source = map_node_index.get(sourcecity);
        var targetcity = d.properties.destination_city;
        var target = map_node_index.get(targetcity);

        if(d.properties.hub != "null" &&
            d.properties.hub_city!= undefined)
        {
            //console.log("d.properties.hub_city",d.properties.hub_city);

            var hubcity = d.properties.hub_city;
            var hub = map_node_index.get(hubcity);


            var linename_1 = sourcecity + " -> " +hubcity;
            if( map_line_compute.has(linename_1)){
                var tempnumber = map_line_compute.get(linename_1);
                tempnumber++;
                map_line_compute.set(linename_1 , tempnumber);
            }
            else{
                map_line_compute.set(linename_1 , 1);
            }

            //var linename_2 = hubcity + " -> " + targetcity;



            if(hubcount < 153){

                var linename_2 =  targetcity + " -> " + hubcity;

                if( map_line_compute.has(linename_2)){
                    var tempnumber = map_line_compute.get(linename_2);
                    tempnumber++;
                    map_line_compute.set(linename_2 , tempnumber);
                }
                else{
                    map_line_compute.set(linename_2 , 1);
                }
                hubcount++;
            }



            /*
            var linename_2_1 = hubcity + " -> " + targetcity;
            var linename_2_2 =  targetcity + " -> " + hubcity;

            if( map_line_compute.has(linename_2_1)){
                var tempnumber = map_line_compute.get(linename_2_1);
                tempnumber++;
                map_line_compute.set(linename_2_1 , tempnumber);
            }
            else{
                map_line_compute.set(linename_2_1 , 1);
            }



            if( map_line_compute.has(linename_2_1) &&
                map_line_compute.has(linename_2_2) )
            {
                //console.log("fuck this is the bug");
                var count1 = map_line_compute.get(linename_2_1);
                var count2 = map_line_compute.get(linename_2_2);
                var count = count1 + count2;
                map_line_compute.set(linename_2_1 , count);
                map_line_compute.delete(linename_2_2);
            }
            */


        }
        else if(d.properties.hub == "null"){

            var linename = sourcecity + " -> " +targetcity;
            //console.log("line", linename);

            if( map_line_compute.has(linename)){
                var tempnumber = map_line_compute.get(linename);
                tempnumber++;
                map_line_compute.set(linename , tempnumber);
            }
            else{
                map_line_compute.set(linename , 1);
            }

        }
        //console.log("source", source);

    });

    //console.log("map_line_compute", map_line_compute);

    /*
    map_line_compute.forEach(function (value, key){
        var arr = key.split(" -> ");
        var newkey = arr[1] + " -> " + arr[0];
        if(map_line_compute.has(newkey)){
            //console.log("fuck ===>>" , key, newkey);
            map_line_compute.delete(newkey);
           // map_line_compute.delete(key);
        }

    });
    */



    map_line_compute.forEach(function (value, key){
        //console.log(key);
        var arr = key.split(" -> ");
       // console.log("arr", arr);

        var templine = {
            "source" : map_node_index.get(arr[0]),
            "target" : map_node_index.get(arr[1]),
            "value" : value
        }
        links.push(templine);

    });

    //console.log("this airports are", airpot_dict);

    var flowforsankey = {
        "nodes": nodes,
        "links": links
    }

    //console.log("flowforsankey",flowforsankey);


    fswirting.writeFile('data/flowsforsankey.json', JSON.stringify(flowforsankey, null, 4), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("JSON saved\n");
        }
    });

});

