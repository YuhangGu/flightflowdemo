/*
 * Created by Aero on 8/2/2018.
 */

Survey.Survey.cssType = "bootstrap";

var surveyJSON = {

    //surveyId: 'f645c4bd-4c4f-4d53-8da7-eb04860c4cc3',
    surveyPostId: '72a75e01-186d-44d3-bc70-d58fe7db55cb',
    completeText: "Finish",
    pageNextText: "Continue",
    pagePrevText: "Previous",
    firstPageIsStarted: true,

    pages: [
        {
            name: "pStart",
            elements: [
                {
                    name: "introduction",
                    type: "panel",
                    elements: [
                        {
                            "type": "html",
                            "name": "income_intro",
                            "html": "" +
                            "<article class='intro'>" +
                            " <h1 class='intro__heading intro__heading--income title'>Introduction</h1>" +
                            "<div class='intro__body wysiwyg'> <p>Please finish following tasks using the flow map on the left. " +
                            "And please kindly provide your details for this survey " +
                            "and we will analysis and process it confidentiality.\n </p></div></article>"
                        }
                    ]

                }
            ]
        },


        {
            name: "pUserInfo",
            elements: [

                {
                    name: "introduction",
                    type: "panel",
                    elements: [
                        {
                            "type": "html",
                            "name": "income_intro",
                            "html": "" +
                            "<article class='userInfo'>" +
                            " <h1 class='intro__heading intro__heading--income title'> </h1>" +
                            "<div class='intro__body wysiwyg'> <p>Please enter your details which will help this usability test </p></div></article>"
                        }
                    ]

                },

                {
                    name: "name",
                    type: "text",
                    title: "Your name:",
                    isRequired: true,
                    placeHolder: "...",
                },
                {
                    name: "gender",
                    type: "dropdown",
                    title: "Your gender:",
                    isRequired: true,
                    choices: ["male", "female"]
                },
                {
                    name: "education",
                    type: "dropdown",
                    title: "Your education:",
                    isRequired: true,
                    choices: ["Bsc", "Msc", "Phd"]
                },
                {
                    name: "birth year",
                    type: "dropdown",
                    title: "How old are you:",
                    isRequired: true,
                    choices: ["18~25", "26~35", "36~50", "50+"]
                },
            ]
        },

        {
            name: "pExperenceGIS",
            elements: [
                {
                    name: "GISBackground",
                    type: "panel",
                    elements: [{
                            "type": "html",
                            "name": "income_intro",
                            "html": "" +
                            "<article class='userInfo'>" +
                            " <h1 class='intro__heading intro__heading--income title'> </h1>" +
                            "<div class='intro__body wysiwyg'> <p>" +
                            "Please describe your experience with Cartography and GIS" +
                            "</p></div></article>"
                        }]
                },
                {
                    name: "mapExperence",
                    type: "radiogroup",
                    title: "Have you ever used flow map before?",
                    isRequired: true,
                    //colCount: 1,
                    choices: ["Yes","No"]
                },

                {
                    name: "map3DExperence",
                    type: "radiogroup",
                    title: "Have you ever used 3D map before?",
                    isRequired: true,
                    //colCount: 1,
                    choices: ["Yes","No"]
                },
                {
                    name: "VRExperence",
                    type: "radiogroup",
                    title: "Have you ever used virtual reality before?",
                    isRequired: true,
                    //colCount: 1,
                    choices: ["Yes","No"]
                }]
        },
        {
            name: "pQ1",
            elements: [
                {
                    name: "taskInto",
                    type: "panel",
                    elements: [{
                            "type": "html",
                            "name": "income_intro",
                            "html": "" +
                            "<article class='userInfo'>" +
                            " <h1 class='intro__heading intro__heading--income title'> </h1>" +
                            "<div class='intro__body wysiwyg'> <p>" +
                            "Please finish tasks below with the help of flow map" +
                            "</p></div></article>"}]
                },
                {
                    name: "Q1",
                    type: "nouislider",
                    title: "How many connections are there between Akureyri and other airports in Iceland?",
                    rangeMax: 10,
                    rangeMin: 0,
                }]
        },
        {
            name: "pQ2",
            elements: [{
                    name: "Q2",
                    type: "radiogroup",
                    title: "Is it possible to travel from Husavik to Hofn directly?",
                    isRequired: true,
                    colCount: 0,
                    choices: [ "Yes","No" ]
                }]
        },
        {
            name: "pQ3",
            elements: [{
                    name: "Q3",
                    type: "dropdown",
                    title: "Which airport is the busies in Iceland?",
                    isRequired: true,
                    choices: ["Akureyri","Bildudalur","Egilsstadir", "Gjogur",  "Grimsey","Hofn", "Husavik",
                        "Isafjordur","Keflavik", "Reykjavik","Saudarkrokur", "Thorshofn", "Vestmannaeyjar", "Vopnafjödur"]
            }]
        }

    ]
}


var survey = new Survey.Model(surveyJSON);
var timers = [];

function surveyStart() {
    survey.startTimer();
}


function collectResults( ) {

    //stop timer
    survey.stopTimer();

    //surveyJS server version
    survey.sendResult('95489295-3081-4a64-8fec-ef6547b48776');


    //my own server


    survey.pages.forEach(function (d) {
        console.log("spend",d.timeSpent, "seconds on", d.name );

        if(d.timeSpent > 0){

            timers.push({
                question :  d.name,
                time : d.timeSpent
            })

        }

    });

    setTimeout(sendtoserver,200);
}


function sendtoserver() {

    var res = {
        results : survey.data,
        timer : timers
    }

    //console.log("results", res);

    //collectResults
    //var dataString = JSON.stringify(survey.data);

    var dataString = JSON.stringify(res);

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "../php/saveingSurveydata.php", true);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlhttp.send("foo=" + dataString);
}
