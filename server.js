var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var json2xml = require('json2xml');

var port = 8000;
var public_dir = path.join(__dirname, 'public');

var app = express();
app.use(express.static(public_dir));
app.use(bodyParser.urlencoded({extended: true})); //use in .put

var users;

fs.readFile(path.join(public_dir, 'list.json'), (err, data) => {
	if(err){
		console.log("Error: could not read users.json");
		users = {users: []};
	} else {
		users = JSON.parse(data);
	}
});

app.get('/list-users', (req, res) => {	
	var users2 = JSON.parse(JSON.stringify(users));
	if(req.query.limit != undefined){
		users2.users.splice(req.query.limit, users2.users.length);
	}
	if(req.query.format == 'xml'){
		users2 = json2xml(users2);
		res.type('xml').send(users2);
	}else{
		res.type('json').send(users2);
	}
});

app.put('/add-user', (req, res) => {
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

app.delete('/remove-user', (req, res) => {
	for(let i = 0; i < users.users.length; i++){
		if(users.users[i].id == parseInt(req.body.id, 10)){
			users.users.splice(i, 1);
			fs.writeFile(path.join(public_dir, 'list.json'), JSON.stringify(users, null, 4), (err) => {
				res.status(200).send('Successfully removed the user.');
			});
		} else {
				console.log("ERROR: Attempt to remove user failed because User ID did not exist.");
				res.status(500).send('Error: User ID was not found in database.');
		}
	}
});

app.post('/update-user', (req, res) => {	
	var updatedUser = {
		id: parseInt(req.body.id, 10),
		name: req.body.name,
		email: req.body.email
	};
	var userExists = false;
	for(let i = 0; i < users.users.length; i++){
		if(users.users[i].id == updatedUser.id){
			userExists = true;
		}
	}
	if(!userExists) {
		console.log("ERROR: Attempt to update user failed because User ID did not exist.");
		res.status(500).send('Error: User ID not in database.');
	} else {
		for(let i = 0; i < users.users.length; i++){
			if(users.users[i].id == parseInt(req.body.id, 10)){
				users.users[i].name = req.body.name;
				users.users[i].email = req.body.email;
				fs.writeFile(path.join(public_dir, 'list.json'), JSON.stringify(users, null, 4), (err) => {
					res.status(200).send('Successfully updated the user.');
				});
			}
		}
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