////////////////////////////////////////////////////////////////////////////
// Uses "bouncy" to route domains and subdomains to the appropriate ports //
// Also uses the database to tell which destinations go where             //
////////////////////////////////////////////////////////////////////////////


// import bouncy and the database "wrapper"
var bouncy = require('bouncy'),
    nano = require('nano')('http://localhost:5984');
// using the database called server-management
var db = nano.db.use("server-management"),
    destinations = {};

// A function to update the destinations variable from the database
function getDestinations(callback) {
    db.get('destinations', {
        revs_info: false
    }, function(err, body) {
        if (!err) {
            // the real info is stored in locations
            // such as "domain":{"port":80}
            destinations = body.locations;

            if(callback) callback();
        } else {

        }
    });

}
// The port number for all domains to be sent to
// in this case 80
var PORT_NUMBER = 80;
function start() {
    // initialize the server
    var server = bouncy(function(req, res, bounce) {
        // check the current contents of the destinations object for 
        // the route
        var destinations_in_db = destinations[req.headers.host];
        if (destinations_in_db) {
            // found, route it to the port given by the entry
            bounce(destinations_in_db.port);
        } else {
            // not found, send back a 404 error
            res.statusCode = 404;
            res.end('no such host');
        }
    });
    // turn on the server
    server.listen(PORT_NUMBER);

}
// do an initial loading of the destination data, then start the server
getDestinations(start);
// over time update the data in the destination object to be accurate
// update every 5 minutes
var TIME_INTERVAL = 5 * 60 * 1000;
// start the timer
var timer = setInterval(getDestinations, TIME_INTERVAL);


