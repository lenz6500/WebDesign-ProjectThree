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

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
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
	}
});

db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, rows) => {
	var nObject;
	for(var i = 0; i < rows.length; i++){
		nObject = 'N' + rows[i].neighborhood_number;
		neighborhoodsObject[nObject] = rows[i].neighborhood_name;
	}
});

db.all("SELECT * FROM Incidents ORDER BY date_time DESC", (err, rows) => {
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
            res.type('xml').send(js2xmlparser.parse("Codes", newCodesObject));
        }
        else{
            res.type('json').send(JSON.stringify(newCodesObject, null, 4));
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
    var start_date = null;
    var end_date = null;
    if (req.query.start_date != null){
        start_date = new Date(req.query.start_date);
    }
    if (req.query.end_date != null){
        end_date = new Date(req.query.end_date);
    }
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
    var limit = 10000;
    var format = req.query.format;
    if (format == null){
        format = 'json';
    }

    if (req.query.limit != null){
        limit = req.query.limit;
    }

    /*Narrows down by date*/
    keys = Object.keys(incidentsObject);
    var newIncidentsObject = new Object;
    var dateIncidentsObject = new Object;
    if (start_date != null && end_date != null){
        for(var i = 0; i < keys.length; i++){
            var currDate = new Date(incidentsObject[keys[i]].date);
            if (currDate.getTime() >= start_date.getTime() && currDate.getTime() <= end_date.getTime()){
                dateIncidentsObject[keys[i]]=incidentsObject[keys[i]];
            }
        }
    }
    else if (start_date != null && end_date == null){
        for(var i = 0; i < keys.length; i++){
            var currDate = new Date(incidentsObject[keys[i]].date);
            if (currDate.getTime() >= start_date.getTime()){
                dateIncidentsObject[keys[i]]=incidentsObject[keys[i]];
            }
        }
    }
    else if (start_date == null && end_date != null){
        for(var i = 0; i < keys.length; i++){
            var currDate = new Date(incidentsObject[keys[i]].date);
            if (currDate.getTime() <= end_date.getTime()){
                dateIncidentsObject[keys[i]]=incidentsObject[keys[i]];
            }
        }
    }
    else{
        for(var i = 0; i < keys.length; i++){
            dateIncidentsObject[keys[i]]=incidentsObject[keys[i]];
        }
    }

    /*Narrows down by code*/
    codeIncidentsObject = new Object;
    newKeys = Object.keys(dateIncidentsObject);
    if (codeRange != null){
        for (var i = 0; i < newKeys.length; i++){
            if (parseInt(dateIncidentsObject[newKeys[i]].code) >= lowerCode && parseInt(dateIncidentsObject[newKeys[i]].code) <= upperCode){
                codeIncidentsObject[newKeys[i]]=dateIncidentsObject[newKeys[i]];
            }
        }
    }
    else{
        codeIncidentsObject = dateIncidentsObject;
    }

    /*Narrows down by grid*/
    gridTempIncidentsObject = new Object;
    newKeys = Object.keys(codeIncidentsObject);
    if (gridRange != null){
        for (var i = 0; i < newKeys.length; i++){
            if (parseInt(codeIncidentsObject[newKeys[i]].police_grid) >= lowerGrid && parseInt(codeIncidentsObject[newKeys[i]].police_grid) <= upperGrid){
                gridTempIncidentsObject[newKeys[i]]=codeIncidentsObject[newKeys[i]];
            }
        }
    }
    else{
        gridTempIncidentsObject = codeIncidentsObject;
    }

    /*Narrows by neighborhood*/
    neighborhoodTempIncidentsObject = new Object;
    newKeys = Object.keys(gridTempIncidentsObject);
    if (neighborhoodRange != null){
        for (var i = 0; i < newKeys.length; i++){
            if (parseInt(gridTempIncidentsObject[newKeys[i]].neighborhood_number) >= lowerNeighborhood && parseInt(gridTempIncidentsObject[newKeys[i]].neighborhood_number) <= upperNeighborhood){
                neighborhoodTempIncidentsObject[newKeys[i]]=gridTempIncidentsObject[newKeys[i]];
            }
        }
    }
    else{
        neighborhoodTempIncidentsObject = gridTempIncidentsObject;
    }

    /*Narrows by limit*/
    newKeys = Object.keys(neighborhoodTempIncidentsObject);
    var finalIncidentsObject = new Object;
    for (var j = 0; j < limit; j++){
        finalIncidentsObject[newKeys[j]]=neighborhoodTempIncidentsObject[newKeys[j]];
    }

    /*Narrows by format*/
    if (format == 'xml'){
        res.type('xml').send(js2xmlparser.parse("Incidents", finalIncidentsObject));
    }else{
        res.type('json').send(JSON.stringify(finalIncidentsObject, null, 4));
    }
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
	for(i in incidentsObject){
		if(i == req.body.case_number){
			hasBeenUsed = true;
		}
	}
    var newDateTime = req.body.date + 'T' + req.body.time;
    var data = [newCaseNumber, newDateTime, req.body.code, req.body.incident, req.body.police_grid, req.body.neighborhood_number, req.body.block];
	if(hasBeenUsed) {
		console.log("ERROR: Attempt to add incident failed because the case number has already been used.");
		res.status(500).send('Error: Case number already exists.');
	} else {
		incidentsObject[newCaseNumber] = newIncident;
<<<<<<< HEAD
		
		var sql = "INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES ('" + newCaseNumber + "', '" + newIncident.date + "T" + newIncident.time + "', '" + newIncident.code + "', '" + newIncident.incident + "', '" + newIncident.police_grid + "', '" + newIncident.neighborhood_number + "', '" + newIncident.block + "')";
		console.log(sql);
		db.run(sql, (err, result)=>{
			if(err){
				console.log("Data wasn't inserted.");
				console.log(err);
			}
			res.status(200).send('Successfully added the user.');
		});	
=======
        db.run("INSERT INTO Incidents(case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES(?, ?, ?, ?, ?, ?, ?)", data, err => {
            if (err){
                res.status(500).send('Error uploading data to database');
                console.log("ERROR: Could not upload data to database");
            }
            else{
                res.status(200).send('Successfully added the incident.');
            }
        });
>>>>>>> e3f0dfe21b8fb0115d64bb36533143aa90287fd4
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
