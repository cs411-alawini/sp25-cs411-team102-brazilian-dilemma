var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');


var connection = mysql.createConnection({
	host: '35.224.191.87',
	user: 'ashwin',
	password: '1%FN9ri`Il6Ur=r#8;/q',
	database: 'flight-data'

});

connection.connect;

var app = express();
// set up ejs view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '../public'));


/* GET home page, respond by rendering index.ejs */
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/success', function(req, res) {
      res.send({'message': 'statments selected success!'});
});

app.get('/fetch-flights', (req, res) => {
  res.render('fetch-flights');
});

// Route for login/signup
app.get('/login', (req, res) => {
  // Render login/signup page or redirect
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);
  
  const sql = 'SELECT * FROM Users WHERE username = ? AND password = ?';

  // Query the database
  connection.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server error');
    }

    if (results.length > 0) {
      // If user is found, login successful
      // res.send('Login successful!');
      res.redirect('/');
    } else {
      // If no match found
      res.send('Invalid username or password');
    }
  });
});

app.get('/sign-up', (req, res) => {
	res.render('signup');
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  const query = 'INSERT INTO Users (username, password) VALUES (?, ?)';
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.send('Username already taken.');
      } else {
        console.error('Error during signup:', err);
        res.status(500).send('Server error');
      }
      return;
    }

    res.send('Account created successfully!');
  });
});
app.get('/delete-reservation', (req, res) => {
  res.render('delete-reservation');
});

app.post('/submit-delete', (req, res) => {
  const { email, flightNumber, bookingId } = req.body;

  // SQL query to delete the reservation
  const sql = `DELETE FROM Booking WHERE Email = ? AND FlightNumber = ? AND BookingId = ?`;

  // Use connection.format() to safely inject the values into the query
  const formattedSql = connection.format(sql, [email, flightNumber, bookingId]);

  // Log the formatted SQL for debugging purposes
  console.log('Formatted SQL:', formattedSql);

  // Perform the deletion query
  connection.query(formattedSql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server error');
    }

    // Check if any rows were affected (i.e., a reservation was deleted)
    if (results.affectedRows > 0) {
      // If deletion is successful, send a success response
      res.redirect('/');
    } else {
      // If no reservation was found with the provided details
      res.send('No reservation found with the given email, flight number, and departure date.');
    }
  });
});

// this code is executed when a user clicks the form submit button
app.post('/fetch-flights', function(req, res) {
  const email = req.body.email; 

  // Ensure the email value is provided
  if (!email) {
    return res.status(400).send('Email is required.');
  }

  const sql = 'SELECT * FROM Booking WHERE Email = ?';
  
  // Properly format the SQL query
  const formattedSql = connection.format(sql, [email]);

  console.log('Formatted SQL:', formattedSql);

  // Execute the query
  connection.query(formattedSql, (err, results) => {
    if (err) {
      console.log("Database error: ", err);
      return res.status(500).send("Server error");
    }

    // Check if any results were returned
    if (results.length > 0) {
      // If reservations exist for the provided email
      res.send(results); // Send the results back (could be in JSON format)
    } else {
      // If no results were found for the email
      res.send('Email not found or this email does not have any reservations');
    }
  });
});

app.post('/search-flight', (req, res) => {
  const flightNumber = req.body.flightNumber;

  if (!flight) {
    return res.status(400).send("Flight number is required");
  }

  const sql = "SELECT * FROM Flight WHERE FlightNumber = ?";

  const formattedSql = connection.format(sql, [flightNumber]);

  
  console.log('Formatted SQL:', formattedSql);

  // Execute the query
  connection.query(formattedSql, (err, results) => {
    if (err) {
      console.log("Database error: ", err);
      return res.status(500).send("Server error");
    }

    // Check if any results were returned
    if (results.length > 0) {
      // If reservations exist for the provided email
      res.send(results); // Send the results back (could be in JSON format)
    } else {
      // If no results were found for the email
      res.send('There were no results for this flight. Make sure the format is in e.g. AA 2014 format');
    }
  });
});

app.listen(80, function () {
	console.log('Node app is running on port 80');
});
