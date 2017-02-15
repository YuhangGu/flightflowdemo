/**
 * Created by Aero on 23/09/2016.
 */

var fs = require('fs');
var fswirting = require('fs');
var flights;

fs.readFile('data/arrivalflows.json', 'utf8', function (err, flightdata) {

    if (err) throw err;
    flights = JSON.parse(flightdata);

    var airportSet = new Set();

    flights.features.forEach( function(d){

        airportSet.add(d.properties.origin);
        airportSet.add(d.properties.destination);

    });


    var airports_dict = [];

    airportSet.forEach(function(d,i){
        airports_dict.push(d)
    });



    var num = airports_dict.length;

    var matrix = [];

    for( var i = 0; i < num; i ++)
    {
        var temp = [];

        for(var j=0; j<num; j++){
            temp.push(0);
        }

        matrix.push(temp);
       // console.log(temp.length,i);
    }


    //console.log(matrix);



    flights.features.forEach( function(d){
        var m = airports_dict.indexOf(d.properties.origin),
            n = airports_dict.indexOf(d.properties.destination);

        matrix[m][n] =  matrix[m][n] +1;

    });

    //console.log(matrix);




    var matrixoutput = {
        "index": airports_dict,
        "matrix": matrix
    }


    fswirting.writeFile('data/matrix.json', JSON.stringify(matrixoutput, null, 4), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("JSON saved\n");
        }
    });




});


