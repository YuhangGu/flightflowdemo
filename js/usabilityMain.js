/*
 * Created by Aero on 8/2/2018.
 */

function usabilityInit(tpye) {


    if(tpye === '2D'){
        console.log("2D visualization");
        VisInit2D();
    }
    else if(tpye === '3D'){
        console.log("3D visualization");
        VisInit3D();

    }
    else if(tpye === 'VR'){
        console.log("VR visualization");
    }

    //initailize questionnaire
    $("#surveyContainer").Survey({
        model: survey,
        onStarted: surveyStart,
        onComplete: collectResults,
    });

}