var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var json2xml = require('json2xml');
var sqlite3 = require('sqlite3');

var port = 8000;
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));

var codesObject = new Object;
var neighborhoodsObject = new Object;
var incidentsObject = new Object;

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

db.all("SELECT * FROM Codes ORDER BY code", (err, rows) => {
	var cObject;
	for(var i = 0; i < rows.length; i++){
		cObject = 'C' + rows[i].code;
		codesObject[cObject] = rows[i].incident_type;
		//codesObject[rows[i].code] = rows[i].incident_type;
	}
});

db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, rows) => {
	var nObject;
	for(var i = 0; i < rows.length; i++){
		nObject = 'N' + rows[i].neighborhood_number;
		neighborhoodsObject[nObject] = rows[i].neighborhood_name;
	}
});

/* Need to fix this */
db.all("SELECT * FROM Incidents ORDER BY case_number DESC", (err, rows) => {
	for(var i = 0; i < rows.length; i++){
		var newDate = rows[i].date_time.substring(0,10);
		var newTime = rows[i].date_time.substring(11);
		var report = {
			date: newDate,
			time: newTime,
			code: rows[i].code,
			incident: rows[i].incident,
			police_grid: rows[i].police_grid,
			neighborhood_number: rows[i].neighborhood_number,
			block: rows[i].block
		};
		incidentsObject[rows[i].case_number] = report;
	}
	/*incidentsObject.sort(function(a, b){
		return b[rows[i].case_number] - a[rows[i].case_number];
	});*/
});


app.get('/codes', (req, res) => {
    var range = codesObject.length;
    var lowerRange = 0;
    var upperRange = 0;

    if (req.query.code != null){
        range = req.query.code;
        lowerRange = range.slice(0, range.indexOf(','));
        upperRange = range.slice(range.indexOf(',')+1);
        var newCodesObject = new Object;
        var keys = Object.keys(codesObject);
        for (var i = 0; i < keys.length; i++){
            if (parseInt(keys[i].slice(1)) >= lowerRange && parseInt(keys[i].slice(1)) <= upperRange){
                newCodesObject[keys[i]]=codesObject[keys[i]];
            }
        }
        res.type('json').send(JSON.stringify(newCodesObject, null, 4));
    }
    else{
        res.type('json').send(JSON.stringify(codesObject, null, 4));
    }
});

app.get('/neighborhoods', (req, res) => {
	res.type('json').send(JSON.stringify(neighborhoodsObject, null, 4));
});

app.get('/incidents', (req, res) => {
	res.type('json').send(JSON.stringify(incidentsObject, null, 4));
});

app.put('/new_incident', (req, res) => {
    newCaseNumber = req.body.case_number;
	var newIncident = {
        date: req.body.date,
        time: req.body.time,
        code: req.body.code,
        incident: req.body.incident,
        police_grid: req.body.police_grid,
        neighborhood_number: req.body.neighborhood_number,
        block: req.body.block
	};

	var hasBeenUsed = false;
	for(let i = 0; i < incidentsObject.length; i++){
		if(incidentsObject.id == newUser.id){
			hasBeenUsed = true;
		}
	}
	if(hasBeenUsed) {
		console.log("ERROR: Attempt to add incident failed because the case number has already been used.");
		res.status(500).send('Error: Case number already exists.');
	} else {
		incidentsObject[newCaseNumber] = newIncident;
		res.status(200).send('Successfully added the user.');
	}
});


function ReadFile(filename) { //Simple read file option.
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
}

console.log('Now listening on port ' + port);
var server = app.listen(port);
