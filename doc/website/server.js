var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');
var connection = mysql.createConnection({
	host: '35.224.191.87',
	user: 'ashwin',
	password: 'Z<4?bbjs$&[`5EvOGyv|',
	database: 'flight-data'

});

connection.connect;



var app = express();
// set up ejs view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '../public'));

/* GET home page, respond by rendering index.ejs */
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/success', function(req, res) {
      res.send({'message': 'statments selected success!'});
});

// Route for login/signup
app.get('/login', (req, res) => {
  // Render login/signup page or redirect
  res.send('Login / Signup page');
});
 
// this code is executed when a user clicks the form submit button
app.post('/fetch-flights', function(req, res) {
   
var sql = 'SELECT * FROM Flight LIMIT 10';
//var sql = 'CREATE TABLE Feature (feature_name VARCHAR(255) NOT NULL';
  connection.query(sql, function(err, results) {
    if (err) {
      console.error('Error fetching attendance data:', err);
      res.status(500).send({ message: 'Error fetching attendance data', error: err });
      return;
    }
    res.json(results);
  });
console.log(sql);
});
app.listen(80, function () {
	console.log('Node app is running on port 80');
});
