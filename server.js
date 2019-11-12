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
	for(var i = 0; i < rows.length; i++){
		codesObject[rows[i].code] = rows[i].incident_type;
	}
});

db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, rows) => {
	for(var i = 0; i < rows.length; i++){
		neighborhoodsObject[rows[i].neighborhood_number] = rows[i].neighborhood_name;
	}
});

/* Need to fix this */
db.all("SELECT * FROM Incidents ORDER BY date_time DESC", (err, rows) => {
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
});


app.get('/codes', (req, res) => {
	res.type('json').send(JSON.stringify(codesObject, null, 4));
});

app.get('/neighborhoods', (req, res) => {
	res.type('json').send(JSON.stringify(neighborhoodsObject, null, 4));
});

app.get('/incidents', (req, res) => {
	res.type('json').send(JSON.stringify(incidentsObject, null, 4));
});

app.put('/new_incident', (req, res) => {
	var newUser = {
		id: parseInt(req.body.id, 10),
		name: req.body.name,
		email: req.body.email
	};

	var hasBeenUsed = false;
	for(let i = 0; i < users.users.length; i++){
		if(users.users[i].id == newUser.id){
			hasBeenUsed = true;
		}
	}
	if(hasBeenUsed) {
		console.log("ERROR: Attempt to add user failed because User ID has already been used.");
		res.status(500).send('Error: User ID already exists.');
	} else {
		users.users.push(newUser);
		fs.writeFile(path.join(public_dir, 'list.json'), JSON.stringify(users, null, 4), (err) => {
			res.status(200).send('Successfully added the user.');
		});
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
