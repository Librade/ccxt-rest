'use strict';

var ccxt = require ('ccxt')
    , CircularJSON = require('circular-json')
    , db = require('./../db')
    , express = require('express');

module.exports =  function(app) {
  var router = express.Router();

  app.use('/exchanges', router);

  // from https://strongloop.github.io/strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/#using-es7-asyncawait
  let wrap = fn => (...args) => fn(...args).catch(args[2])

  router.get('/', function(req, res, next) {
    res.send(CircularJSON.stringify(ccxt.exchanges));
  });

  router.get('/:exchangeName', function(req, res, next) {
    var exchangeName = req.params.exchangeName;
    var exchangeIds = db.getExchangeIds(exchangeName);
    res.send(CircularJSON.stringify(exchangeIds));
  });

  router.post('/:exchangeName', function(req, res, next) {
    var reqBody = req.body;
    var exchangeName = req.params.exchangeName;

    var exchange = new ccxt[exchangeName](reqBody);
    db.saveExchange(exchangeName, exchange);

    res.send(CircularJSON.stringify(exchange));
  });

  router.get('/:exchangeName/:exchangeId', function(req, res, next) {
    var exchangeName = req.params.exchangeName;
    var exchangeId = req.params.exchangeId
    var exchange = db.getExchange(exchangeName, exchangeId);
    if (exchange) {
      res.send(CircularJSON.stringify(exchange));
    } else {
      res.sendStatus(404);
    }

  });

  router.delete('/:exchangeName/:exchangeId', function(req, res, next) {
    var exchangeName = req.params.exchangeName;
    var exchangeId = req.params.exchangeId

    var exchange = db.deleteExchange(exchangeName, exchangeId);

    if (exchange) {
      res.send(CircularJSON.stringify(exchange));
    } else {
      res.sendStatus(404);
    }
  });

  function createErrorObject(error) {
    return {
      name: error.name,
      type: error.constructor.name,
      message: error.message,
      isRecoverable: (error instanceof ccxt.NetworkError)
    };
  }

  router.post('/:exchangeName/:exchangeId/:methodName', wrap(async function(req, res) {
    var exchangeName = req.params.exchangeName;
    var exchangeId = req.params.exchangeId
    var methodName = req.params.methodName
    var reqBody = req.body;

    var exchange = db.getExchange(exchangeName, exchangeId);

    if (!exchange) {
      res.sendStatus(404);
      return;
    }

    try {
      var response = await exchange[methodName].apply(exchange, reqBody);
      res.send(CircularJSON.stringify(response));
    } catch (e) {
      // if the exception is thrown, it is "caught" and can be handled here
      // the handling reaction depends on the type of the exception
      // and on the purpose or business logic of your application
      res.status(500).send(CircularJSON.stringify(createErrorObject(e)));
    }
  }));

  router.post('/:exchangeName/:exchangeId/property/:exchangePropertyName', function(req, res, next) {
    const exchangeName = req.params.exchangeName;
    const exchangeId = req.params.exchangeId
    const exchangePropertyName = req.params.exchangePropertyName;
    const reqBody = req.body;

    const exchange = db.getExchange(exchangeName, exchangeId);

    if (!exchange) {
      res.sendStatus(404);
      return;
    }

    try {
      if (reqBody instanceof Array && reqBody.length > 0) {
        res.send(CircularJSON.stringify((exchange[exchangePropertyName])[reqBody[0]]));
      } else {
        res.send(CircularJSON.stringify(exchange[exchangePropertyName]));
      }
    } catch (e) {
      // if the exception is thrown, it is "caught" and can be handled here
      // the handling reaction depends on the type of the exception
      // and on the purpose or business logic of your application
      res.status(500).send(CircularJSON.stringify(createErrorObject(e)));
    }
  });
};
