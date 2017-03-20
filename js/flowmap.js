
//storing the frequency of in-outgoing flights
var frequency_hourly_d = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,];
var frequency_hourly_a = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,];
var matrix_list_24 =   [];

function flowVisStart(){

    loadWorldMapDeoData(function(){
        loadFlightData( function(){
            initFlightFlowMap();
        });

    } );
}






