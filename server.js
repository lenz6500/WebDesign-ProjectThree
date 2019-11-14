var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var js2xmlparser = require('js2xmlparser');
var sqlite3 = require('sqlite3');
var sortObj = require('sort-object');

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

db.all("SELECT * FROM Incidents ORDER BY date_time DESC LIMIT 10000", (err, rows) => {
    var iObject;
	for(var i = 0; i < rows.length; i++){
		var newDate = rows[i].date_time.substring(0,10);
		var newTime = rows[i].date_time.substring(11);
        newTime = newTime.substring(0, newTime.indexOf('.'));
		var iObject;
		var report = {
			date: newDate,
			time: newTime,
			code: rows[i].code,
			incident: rows[i].incident,
			police_grid: rows[i].police_grid,
			neighborhood_number: rows[i].neighborhood_number,
			block: rows[i].block
		};
        iObject = 'I' + rows[i].case_number;
		incidentsObject[iObject] = report;
	}
});

app.get('/codes', (req, res) => {
    var range = Object.keys(codesObject).length;
    var lowerRange = 0;
    var upperRange = 0;
    var format = 'json';

    if (req.query.code != null && req.query.format != null){
        range = req.query.code;
        format = req.query.format;
        lowerRange = range.slice(0, range.indexOf(','));
        upperRange = range.slice(range.indexOf(',')+1);
        var newCodesObject = new Object;
        var keys = Object.keys(codesObject);
        for (var i = 0; i < keys.length; i++){
            if (parseInt(keys[i].slice(1)) >= lowerRange && parseInt(keys[i].slice(1)) <= upperRange){
                newCodesObject[keys[i]]=codesObject[keys[i]];
            }
        }
        if (format == 'xml'){
            res.type('xml').send(js2xmlparser.parse("Codes", codesObject));
        }
        else{
            res.type('json').send(JSON.stringify(codesObject, null, 4));
        }
    }
    else if (req.query.code != null && req.query.format == null){
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
        res.type(format).send(JSON.stringify(newCodesObject, null, 4));
    }
    else if (req.query.code == null && req.query.format != null){
        format = req.query.format;
        if (format == 'xml'){
            res.type('xml').send(js2xmlparser.parse("Codes", codesObject));
        }
        else{
            res.type('json').send(JSON.stringify(codesObject, null, 4));
        }
    }
    else{
        res.type(format).send(JSON.stringify(codesObject, null, 4));
    }
});

app.get('/neighborhoods', (req, res) => {
    var range = Object.keys(neighborhoodsObject).length;
    var lowerRange = 0;
    var upperRange = 0;
    var format = 'json';

    if (req.query.id != null && req.query.format != null){
        range = req.query.id;
        format = req.query.format;
        lowerRange = range.slice(0, range.indexOf(','));
        upperRange = range.slice(range.indexOf(',')+1);
        var newNeighborhoodsObject = new Object;
        var keys = Object.keys(neighborhoodsObject);
        for (var i = 0; i < keys.length; i++){
            if (parseInt(keys[i].slice(1)) >= lowerRange && parseInt(keys[i].slice(1)) <= upperRange){
                newNeighborhoodsObject[keys[i]]=neighborhoodsObject[keys[i]];
            }
        }
        if (format == 'xml'){
            res.type('xml').send(js2xmlparser.parse("Neighborhoods", newNeighborhoodsObject));
        }
        else{
            res.type('json').send(JSON.stringify(newNeighborhoodsObject, null, 4));
        }
    }
    else if (req.query.id != null && req.query.format == null){
        range = req.query.id;
        lowerRange = range.slice(0, range.indexOf(','));
        upperRange = range.slice(range.indexOf(',')+1);
        var newNeighborhoodsObject = new Object;
        var keys = Object.keys(neighborhoodsObject);
        for (var i = 0; i < keys.length; i++){
            if (parseInt(keys[i].slice(1)) >= lowerRange && parseInt(keys[i].slice(1)) <= upperRange){
                newNeighborhoodsObject[keys[i]]=neighborhoodsObject[keys[i]];
            }
        }
        res.type(format).send(JSON.stringify(newNeighborhoodsObject, null, 4));
    }
    else if (req.query.id == null && req.query.format != null){
        format = req.query.format;
        if (format == 'xml'){
            res.type('xml').send(js2xmlparser.parse("Neighborhoods", neighborhoodsObject));
        }
        else{
            res.type('json').send(JSON.stringify(neighborhoodsObject, null, 4));
        }
    }
    else{
        res.type(format).send(JSON.stringify(neighborhoodsObject, null, 4));
    }
});

app.get('/incidents', (req, res) => {
    var start_date = new Date(req.query.start_date);
    var end_date = new Date(req.query.end_date);
    var codeRange = req.query.code;
    if (codeRange != null){
        var lowerCode = codeRange.slice(0, codeRange.indexOf(','));
        var upperCode = codeRange.slice(codeRange.indexOf(',')+1);
    }
    var gridRange = req.query.grid;
    if (gridRange != null){
        var lowerGrid = gridRange.slice(0, gridRange.indexOf(','));
        var upperGrid = gridRange.slice(gridRange.indexOf(',')+1);
    }
    var neighborhoodRange = req.query.id;
    if (neighborhoodRange != null){
        var lowerNeighborhood = neighborhoodRange.slice(0, neighborhoodRange.indexOf(','));
        var upperNeighborhood = neighborhoodRange.slice(neighborhoodRange.indexOf(',')+1);
    }
    var limit = req.query.limit;
    var format = req.query.format;

    keys = Object.keys(incidentsObject);
    var newIncidentsObject = new Object;
    if (start_date != null){
        for(var i = 0; i < keys.length; i++){
            var currDate = new Date(incidentsObject[keys[i]].date);
            if (currDate.getTime() >= start_date.getTime()){
                newIncidentsObject[keys[i]]=incidentsObject[keys[i]];
            }
        }
    }
	res.type('json').send(JSON.stringify(newIncidentsObject, null, 4));
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
7
	var hasBeenUsed = false;
	for(i in incidentsObject){
		console.log(i);
		if(i == req.body.case_number){
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
