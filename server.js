var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var js2xmlparser = require('js2xmlparser');
var sqlite3 = require('sqlite3');
var sortObj = require('sort-object');
var cors = require('cors');

var port = 8000;
var db_filename = path.join(__dirname, 'stpaul_crime.sqlite3');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

var codesObject = new Object;
var neighborhoodsObject = new Object;

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});
/*codes page*/
app.get('/codes', (req, res) => {
	
	db.all("SELECT * FROM Codes ORDER BY code", (err, rows) => {
		var cObject;
		for(var i = 0; i < rows.length; i++){
			cObject = 'C' + rows[i].code;
			codesObject[cObject] = rows[i].incident_type;
		}

		var values;
		var format = 'json';
		/*Both extra parameters are used*/
		if (req.query.code != null && req.query.format != null){
			values = req.query.code.split(',');
			format = req.query.format;
			for (var i = 0; i < values.length; i++){
				values[i] = parseInt(values[i], 10);
			}
			var newCodesObject = new Object;
			var keys = Object.keys(codesObject);
			for (var i = 0; i < keys.length; i++){
				for (var j = 0; j < values.length; j++){
					if (parseInt(keys[i].slice(1)) == values[j]){
						newCodesObject[keys[i]]=codesObject[keys[i]];
					}
				}
			}
			if (format == 'xml'){
				res.type('xml').send(js2xmlparser.parse("Codes", newCodesObject));
			}
			else{
				res.type('json').send(JSON.stringify(newCodesObject, null, 4));
			}
		}
		/*Only codes extra parameter is used*/
		else if (req.query.code != null && req.query.format == null){
			values = req.query.code.split(',');
			for (var i = 0; i < values.length; i++){
				values[i] = parseInt(values[i], 10);
			}
			var newCodesObject = new Object;
			var keys = Object.keys(codesObject);
			for (var i = 0; i < keys.length; i++){
				for (var j = 0; j < values.length; j++){
					if (parseInt(keys[i].slice(1)) == values[j]){
						newCodesObject[keys[i]]=codesObject[keys[i]];
					}
				}
			}
			res.type(format).send(JSON.stringify(newCodesObject, null, 4));
		}
		/*Only format extra parameter is used*/
		else if (req.query.code == null && req.query.format != null){
			format = req.query.format;
			if (format == 'xml'){
				res.type('xml').send(js2xmlparser.parse("Codes", codesObject));
			}
			else{
				res.type('json').send(JSON.stringify(codesObject, null, 4));
			}
		}
		/*Base case*/
		else{
			res.type(format).send(JSON.stringify(codesObject, null, 4));
		}
	});
});
/*Neighborhoods page*/
app.get('/neighborhoods', (req, res) => {

	db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, rows) => {
		var nObject;
		for(var i = 0; i < rows.length; i++){
			nObject = 'N' + rows[i].neighborhood_number;
			neighborhoodsObject[nObject] = rows[i].neighborhood_name;
		}
		var values;
		var format = 'json';
		/*Both extra parameters are used*/
		if (req.query.id != null && req.query.format != null){
			values = req.query.id.split(',');
			format = req.query.format;
			for (var i = 0; i < values.length; i++){
				values[i] = parseInt(values[i], 10);
			}
			var newNeighborhoodsObject = new Object;
			var keys = Object.keys(neighborhoodsObject);
			for (var i = 0; i < keys.length; i++){
				for (var j = 0; j < values.length; j++){
					if (parseInt(keys[i].slice(1)) == values[j]){
						newNeighborhoodsObject[keys[i]]=neighborhoodsObject[keys[i]];
					}
				}
			}
			if (format == 'xml'){
				res.type('xml').send(js2xmlparser.parse("Neighborhoods", newNeighborhoodsObject));
			}
			else{
				res.type('json').send(JSON.stringify(newNeighborhoodsObject, null, 4));
			}
		}
		/*Only id parameter is used*/
		else if (req.query.id != null && req.query.format == null){
			values = req.query.id.split(',');
			for (var i = 0; i < values.length; i++){
				values[i] = parseInt(values[i], 10);
			}
			var newNeighborhoodsObject = new Object;
			var keys = Object.keys(neighborhoodsObject);
			for (var i = 0; i < keys.length; i++){
				for (var j = 0; j < values.length; j++){
					if (parseInt(keys[i].slice(1)) == values[j]){
						newNeighborhoodsObject[keys[i]]=neighborhoodsObject[keys[i]];
					}
				}
			}
			res.type(format).send(JSON.stringify(newNeighborhoodsObject, null, 4));
		}
		/*Only format parameter is used*/
		else if (req.query.id == null && req.query.format != null){
			format = req.query.format;
			if (format == 'xml'){
				res.type('xml').send(js2xmlparser.parse("Neighborhoods", neighborhoodsObject));
			}
			else{
				res.type('json').send(JSON.stringify(neighborhoodsObject, null, 4));
			}
		}
		/*Base case; neither parameter used.*/
		else{
			res.type(format).send(JSON.stringify(neighborhoodsObject, null, 4));
		}
	});
});

/*Incidents page*/
app.get('/incidents', (req, res) => {
	db.all("SELECT * FROM Incidents ORDER BY date_time DESC", (err, rows) => {
		var iObject;
		var incidentsObject = new Object;
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
		var start_date = null;
		var end_date = null;
		if (req.query.start_date != null){
			start_date = new Date(req.query.start_date);
		}
		if (req.query.end_date != null){
			end_date = new Date(req.query.end_date);
		}
		var codeValues = req.query.code;
		if (codeValues != null){
			codeValues = req.query.code.split(',');
			for (var i = 0; i < codeValues.length; i++){
				codeValues[i] = parseInt(codeValues[i], 10);
			}
		}
		var gridValues = req.query.grid;
		if (gridValues != null){
			gridValues = req.query.grid.split(',');
			for (var i = 0; i < gridValues.length; i++){
				gridValues[i] = parseInt(gridValues[i], 10);
			}
		}
		var neighborhoodValues = req.query.id;
		if (neighborhoodValues != null){
			neighborhoodValues = req.query.id.split(',');
			for (var i = 0; i < neighborhoodValues.length; i++){
				neighborhoodValues[i] = parseInt(neighborhoodValues[i], 10);
			}
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
		if (codeValues != null){
			for (var i = 0; i < newKeys.length; i++){
				for (var j = 0; j < codeValues.length; j++){
					if (parseInt(dateIncidentsObject[newKeys[i]].code) == codeValues[j]){
						codeIncidentsObject[newKeys[i]]=dateIncidentsObject[newKeys[i]];
					}
				}
			}
		}
		else{
			codeIncidentsObject = dateIncidentsObject;
		}

		/*Narrows down by grid*/
		gridTempIncidentsObject = new Object;
		newKeys = Object.keys(codeIncidentsObject);
		if (gridValues != null){
			for (var i = 0; i < newKeys.length; i++){
				for (var j = 0; j < gridValues.length; j++){
					if (parseInt(codeIncidentsObject[newKeys[i]].police_grid) == gridValues[j]){
						gridTempIncidentsObject[newKeys[i]]=codeIncidentsObject[newKeys[i]];
					}
				}
			}
		}
		else{
			gridTempIncidentsObject = codeIncidentsObject;
		}

		/*Narrows by neighborhood*/
		neighborhoodTempIncidentsObject = new Object;
		newKeys = Object.keys(gridTempIncidentsObject);
		if (neighborhoodValues != null){
			for (var i = 0; i < newKeys.length; i++){
				for (var j = 0; j < neighborhoodValues.length; j++){
					if (parseInt(gridTempIncidentsObject[newKeys[i]].neighborhood_number) == neighborhoodValues[j]){
						neighborhoodTempIncidentsObject[newKeys[i]]=gridTempIncidentsObject[newKeys[i]];
					}
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
});

/*Add a new crime to database*/
app.put('/new_incident', (req, res) => {
    newCaseNumber = req.body.case_number;
	/*create an object with all crime data*/
	var newIncident = {
        date: req.body.date,
        time: req.body.time,
        code: req.body.code,
        incident: req.body.incident,
        police_grid: req.body.police_grid,
        neighborhood_number: req.body.neighborhood_number,
        block: req.body.block
	};
	/*Check to see if case_number has been already used within database*/
	var hasBeenUsed = false;
	db.all("SELECT * FROM Incidents WHERE case_number= ? ORDER BY date_time DESC", req.body.case_number, (err, rows) => {
		if(rows.length != 0){
			hasBeenUsed = true;
		}
		var newDateTime = req.body.date + 'T' + req.body.time;
		var data = [newCaseNumber, newDateTime, req.body.code, req.body.incident, req.body.police_grid, req.body.neighborhood_number, req.body.block];
		/*Create array with all data to add into database*/
		if(hasBeenUsed) {
			console.log("ERROR: Attempt to add incident failed because the case number has already been used.");
			res.status(500).send('Error: Case number already exists.');
		} else {
			db.run("INSERT INTO Incidents(case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES(?, ?, ?, ?, ?, ?, ?)", data, err => {
				if (err){
					res.status(500).send('Error uploading data to database');
					console.log("ERROR: Could not upload data to database");
				}
				else{
					res.status(200).send('Successfully added the incident.');
				}
			});
		}
	});
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
