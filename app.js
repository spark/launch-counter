var express = require('express.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var database = require('./lib/mongo.js');

var routes = require('./routes/index');
var orders = require('./routes/orders');
var spark = require('spark');

app =  require('express.io')();
app.http().io();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/orders', orders);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var set_cors_headers = function (req, res, next) {
   if ('OPTIONS' === req.method) {
       res.set({
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
           'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept, Authorization',
           'Access-Control-Max-Age': 300
       });
       return res.send(204);
   } else {
     res.set({'Access-Control-Allow-Origin': '*'});
     next();
   }
};

app.use(set_cors_headers);


var debug = require('debug')('launch-counter');

app.set('port', process.env.PORT || 3000);

console.log(process.env.PORT);

spark.on('login', function() {
  var server = app.listen(app.get('port'), function() {
      debug('Express server listening on port ' + server.address().port);
  });
});

spark.login({username: 'photonsoldcounter@spark.io', password: 'countphotons'});
//Socket IO events for on connect
app.io.route('ready', function(req) {
  getCount("photons", function(photonCount) {
    getCount("orders", function(orderCount) {
      console.log("photonCount", photonCount);
      console.log("orderCount", orderCount);
      req.io.emit('currentCount', {
        photons: photonCount,
        orders: orderCount
      });
    });
  });
});

function getCount(record, callback) {
 database.query("counts", { name: record }, function(err, arr) {
  var hasData = (arr && (arr.length > 0));
  var count = (hasData && arr[0].count) ? arr[0].count : 0;
  if (callback) { callback(count); }
 });
}


module.exports = app;
