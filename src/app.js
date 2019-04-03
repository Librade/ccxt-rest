var express = require('express');
var basicAuth = require('express-basic-auth');
var logger = require('morgan');
var ccxt = require ('ccxt');

var appConfig = require('./app-config');
var indexRouter = require('./routes/index');
var exchangesRouter = require('./routes/exchanges');

var app = express();

app.use(basicAuth({ authorizer: envAuthorizer }));

function envAuthorizer(username, password) {
  var envUser = process.env.USER;
  var envPass = process.env.PASSWORD;
  return username === envUser && password === envPass;
}

app.use(logger('dev'));

appConfig.setupRouters(app, function(app) {
  indexRouter(app);
  exchangesRouter(app);
});

module.exports = app;

app.set('port', process.env.PORT || 3000);