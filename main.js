var express = require('express');
var logger = require('morgan');
var app = express();

app.use(logger('dev'));
app.use(express.static('public'));

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send('error'+ err.message );
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send('error'+ err.message );
});

module.exports = app;