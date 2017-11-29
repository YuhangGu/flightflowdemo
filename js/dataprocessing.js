//readfiles();
mergefiles();

function readfiles() {

    var readDirFiles = require('read-dir-files');


    readDirFiles.list('../data/flights', function (err, filenames) {

        if (err) return console.dir(err);

        filenames.forEach(function (t,index) {
            if(index!= 0){
                console.log(t);


                const csv = require('csvtojson')
                //console.dir(filenames[index]);

                var vertices = [];
                var timestamps =[];
                var timeseconds = [];
                var timeStart = 0;
                var altitudes = [];
                var speeds = [];
                var filepath = filenames[index];


                var timeStartHMS = 0;
                var timeStart = 0;




                csv().fromFile(filepath).on('json', function(item, i) {


                    var stringPos = item.Position;
                    var position = stringPos.split(',');

                    vertices.push(
                        [parseFloat(position[0]), parseFloat(position[1])]
                    );


                    /*
                    var stringtime = item.UTC.split('T');
                    var stringhour = stringtime[1].split("Z");
                    var timearray = stringhour[0].split(":");

                       timestamps.push( parseFloat( timearray[0] )*3600 + parseFloat(timearray[1])* 60
                        + parseFloat(timearray[2])  );

                    if( i == 0){
                        timeStart = parseInt( timearray[0] ) * 3600
                            + parseInt(timearray[1]) * 60
                            + parseInt(timearray[2]);
                    }

                    timeseconds.push( parseInt( timearray[0] ) * 3600
                        + parseInt(timearray[1]) * 60
                        + parseInt(timearray[2]) - timeStart );


                    */


                    if(i == 0){

                        timeStart = parseFloat(item.Timestamp);
                        var stringtime = item.UTC.split('T');
                        var stringhour = stringtime[1].split("Z");
                        var timearray = stringhour[0].split(":");

                        timeStartHMS =  parseFloat( timearray[0] )*3600 + parseFloat(timearray[1])* 60
                            + parseFloat(timearray[2]);

                        timestamps.push(timeStartHMS);

                    }
                    else{

                        timestamps.push( timeStartHMS + parseFloat(item.Timestamp) - timeStart  );

                    }



                    altitudes.push(parseInt(item.Altitude));
                    speeds.push(parseInt(item.Speed) );

                }).on('done', function(error) {

                    var line = {
                        geometry : vertices,
                        time : timestamps,
                        //timeseconds : timeseconds,
                        altitude : altitudes,
                        speed: speeds
                    }


                    var fswirting = require('fs');
                    var savepath = '../data/flight_result' + index + '.json'

                    fswirting.writeFile(savepath, JSON.stringify(line, null, 4), function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("JSON saved\n");
                        }
                    });

                });

            }

        });



    });


}

function mergefiles() {

    var concat = require('concat-files');

    var readDirFiles = require('read-dir-files');


    readDirFiles.list('../data/results', function (err, filenames) {

        if (err) return console.dir(err);

        console.log(" filenames.length",  filenames.length);
        console.log(" filenames",  filenames);

        var names = filenames.splice(2, 28);
        console.log(names);
        console.log(names.length);


        concat(names, '../data/mergedres.json', function(err) {
            if (err) throw err
            console.log('done');
        });

    });


}



