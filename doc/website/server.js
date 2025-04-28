var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');


var connection = mysql.createConnection({
	host: '35.224.191.87',
	user: 'ashwin',
	password: '1%FN9ri`Il6Ur=r#8;/q',
	database: 'flight-data',
	multipleStatements: true

});

//connection.connect;

const createEmailUpdateTrigger = () => {
  const triggerSQL = `
    DROP TRIGGER IF EXISTS sync_email_update;

    CREATE TRIGGER sync_email_update
    AFTER UPDATE ON Passenger
    FOR EACH ROW
    BEGIN
      UPDATE Booking
      SET Email = NEW.Email
      WHERE Email = OLD.Email;
    END;
  `;

  connection.query(triggerSQL, (err) => {
    if (err) {
      console.error('Error creating trigger:', err);
    } else {
      console.log('Trigger created successfully.');
    }
  });
};


connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');

  createEmailUpdateTrigger(); // Create the trigger on app startup
});



var app = express();
// set up ejs view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '../public'));


/* GET home page, respond by rendering index.ejs */
app.get('/', function(req, res) {
  res.render('index', {email: "none"});
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
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  
  const sql = 'SELECT * FROM Users WHERE email = ? AND password = ?';

  // Query the database
  connection.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server error');
    }

    if (results.length > 0) {
      // If user is found, login successful
      // res.send('Login successful!');
      res.render('index', {email: email});
    } else {
      // If no match found
      res.send('Invalid email or password');
    }
  });
});

app.get('/sign-up', (req, res) => {
	res.render('signup');
});

app.post('/signup', (req, res) => {
  const { email, password } = req.body;

  const query = 'INSERT INTO Users (email, password) VALUES (?, ?)';
  connection.query(query, [email, password], (err, results) => {
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

  if (!flightNumber) {
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

app.post('/airport-busyness', (req, res) => {
  const airport = req.body.airport;

  if (!airport) {
    return res.status(400).send("Airport code is required: e.g. 'LAX' ");
  }

  const sql = "CALL GetAirportBusyness(?);";

  const formattedSql = connection.format(sql, [airport]);

  
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
      res.send('There were no results for this airport. Make sure the format is in 3 letter format, e.g. LAX');
    }
  });
});
// Helper function to query the database
const queryDatabase = (query, params) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(query, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};


let lastAirline = ''; // Store the last airline selected

// Serve chart page (airline-delays.ejs)
app.get('/airline-delays', (req, res) => {
  // Send the last airline to the view (ejs file)
  res.render('airline-delays', { airline: lastAirline });
});


app.post('/submit-airline', async (req, res) => {
  const airline = req.body.airline;
  console.log('here');
	console.log(airline);

  if (!airline) {
    return res.status(400).send("Airline name is required: e.g. 'American Airlines In' ");
  }
const query = 'SELECT f.AirlineName AS airline, COUNT(*) AS total_flights, SUM(CASE WHEN s.FlightStatus = "ON TIME" THEN 1 ELSE 0 END) AS `on_time`, SUM(CASE WHEN s.FlightStatus = "DELAYED" THEN 1 ELSE 0 END) AS `delayed`, SUM(CASE WHEN s.FlightStatus = "CANCELLED" THEN 1 ELSE 0 END) AS `cancelled` FROM Flight f JOIN Status s ON f.Date = s.Date AND f.FlightNumber = s.FlightNumber WHERE f.AirlineName = ? GROUP BY f.AirlineName';

  const params = [airline];

  connection.query(query, params, (err, results) => {
    if (err) {
      console.log("Database error: ", err);
      return res.status(500).send("Server error");
    }

    if (results.length > 0) {
      const data = results.map(row => {
        const total = row.total_flights || 1;
        return {
          airline: row.airline,
          on_time_pct: ((row.on_time / total) * 100).toFixed(2),
          delayed_pct: ((row.delayed / total) * 100).toFixed(2),
          cancelled_pct: ((row.cancelled / total) * 100).toFixed(2),
          total_flights: total
        };
      });

      const fig = {
        data: [
          {
            x: data.map(d => d.airline),
            y: data.map(d => d.on_time_pct),
            type: 'bar',
            name: 'On Time',
          },
          {
            x: data.map(d => d.airline),
            y: data.map(d => d.delayed_pct),
            type: 'bar',
            name: 'Delayed',
          },
          {
            x: data.map(d => d.airline),
            y: data.map(d => d.cancelled_pct),
            type: 'bar',
            name: 'Cancelled',
          }
        ],
        layout: {
          title: 'Flight Status by Airline',
          barmode: 'group',
          xaxis: { title: 'Airline' },
          yaxis: { title: 'Percentage of Flights' },
        },
      };

      res.render('airline-delays', {
	airline: airline,
	chartData: JSON.stringify(fig)
      });
    } else {
      res.send("There were no results for this query");
    }
  });
});


// cancel flight route
app.post('/cancel-flight', async (req, res) => {
  const {airline, flightNumber} = req.body 

  if (!airline || !flightNumber) {
    return res.status(400).json({ error: 'Airline and flight number are required.' });
  }
console.log(airline);
	console.log(flightNumber);

  // Use the single connection to execute queries directly (no pooling)
  try {
    // Start the transaction
    connection.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ error: 'Transaction start failed: ' + err.message });
      }

      // Query to check the current flight status
      connection.execute(
        `
        SELECT S.FlightStatus 
        FROM Status S
        JOIN Flight F ON F.FlightNumber = S.FlightNumber
        WHERE F.AirlineName = ? AND F.FlightNumber = ?
        `,
        [airline, flightNumber],
        (err, statusRows) => {
          if (err) {
            connection.rollback(() => {
              return res.status(500).json({ error: 'Error fetching flight status: ' + err.message });
            });
          }

          if (statusRows.length === 0) {
            connection.rollback(() => {
              return res.status(404).json({ message: 'Flight not found.' });
            });
          }

          const currentStatus = statusRows[0].FlightStatus;
          console.log('Current status:', currentStatus);

          // If flight is not already cancelled, proceed with cancellation
          if (currentStatus !== 'CANCELLED') {
            // Update flight status to 'CANCELLED'
            connection.execute(
              `
              UPDATE Status 
              SET FlightStatus = 'CANCELLED' 
              WHERE FlightNumber = ?
              `,
              [flightNumber],
              (err) => {
                if (err) {
                  connection.rollback(() => {
                    return res.status(500).json({ error: 'Error updating flight status: ' + err.message });
                  });
                }

                // Update booking status to 'CANCELLED'
                connection.execute(
                  `
                  UPDATE Booking 
                  SET Status = 'CANCELLED' 
                  WHERE FlightNumber = ?
                  `,
                  [flightNumber],
                  (err) => {
                    if (err) {
                      connection.rollback(() => {
                        return res.status(500).json({ error: 'Error updating booking status: ' + err.message });
                      });
                    }

                    // Commit the transaction after both updates are successful
                    connection.commit((err) => {
                      if (err) {
                        connection.rollback(() => {
                          return res.status(500).json({ error: 'Transaction commit failed: ' + err.message });
                        });
                      }

                      // Send success message if everything goes well
                      res.json({ message: 'Flight cancelled and passengers notified.' });
                    });
                  }
                );
              }
            );
          } else {
            // If the flight is already cancelled
            connection.rollback(() => {
              res.json({ message: 'Flight already cancelled.' });
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('Error during cancel flight:', error);
    connection.rollback(() => {
      res.status(500).json({ error: 'An error occurred: ' + error.message });
    });
  }
});




app.listen(80, function () {
	console.log('Node app is running on port 80');
});
