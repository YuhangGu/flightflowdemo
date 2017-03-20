/**
 * Created by Aero on 15/02/2017.
 */
var dataIcelandGeo;
var citynameIndexMap = [];
var migrationmatrix = [];
var lastSelectedCity = null;
var selectedCity = null;
var drawingallSwith = true;
var lines3DSet =[];
var linesPara3DSet =[];
//var visualizationMesh;

function migrationVisStart(e){

    loadIcelandGeoData(function(){
        loadMigrationData( function(){
            init();
        });

    } );
}

function init(){

    visualizeIn2D();
    draw3DFlowMap();
    draw3Dmatrix();
    draw3DSankeyMap();
}

//-------------- run time -----------------
function updateVisualizations(selectedCity){

    var index = citynameIndexMap.indexOf(selectedCity);
    drawingallSwith = false;

    //var thiscityData = migrationmatrix[index];
    graphics2D.g_flows2D.selectAll("." + graphics2D.className2Dflows).remove();

    drawFlowsOn2DMap(index);
    highlightChord(index);
    draw3DFlows(index);
    draw3DSankeyFlows(index);
    update();

}

function highlightChord(index){
    var paths = graphics2D.g_chord.select("#chordRibbonGourp").selectAll("path");
    paths.each(function(d){
        if( d3.select(this).attr("source") == index ||
            d3.select(this).attr("target") == index) {
            d3.select(this).attr("class", "chordHighlightRibbon");
        }
        else{
            d3.select(this).attr("class", "chordMuteRibbon");
        }

    });
}