/**
 * Created by Aero on 08/03/2017.
 */

// for the flight
function loadWorldMapDeoData(callback){

    d3.json("../data/icelandgeo.json", function (error, iceland) {
        dataIcelandGeo = iceland.features;
    });

    setTimeout(callback,200);
}

function loadFlightData(callback){


    setTimeout(callback,200);


}


// for the migration
function loadIcelandGeoData(callback){

    d3.json("../data/icelandgeo.json", function (error, iceland) {
        dataIcelandGeo = iceland.features;
    });

    setTimeout(callback,200);

}

function loadMigrationData(callback){

    d3.json( "../data/iceland-migration.json",function(data){

        migrationmatrix.length = data.length - 1;

        data.forEach(function (d, i){
            if(i!=0){
                migrationmatrix[i-1] = d;
            }
        });

        citynameIndexMap = data[0];

    } );

    setTimeout(callback,200);

}