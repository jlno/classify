const express = require('express');
const bodyParser = require('body-parser');
const brain = require('brain.js');
const config = require('./config');
const shared = require('./shared');
const scan = require('./scan');
const train = require('./train');
const base = require('./base.json');
const app = express();
const dataset = [];
let net, lastPredictionTime, buffer = {};

app.use(bodyParser.json());

app.post('/api/reset-buffer', (req, res) => {
  buffer = {};
  res.send().status(200);
});

app.post('/api/predict', (req, res) => {
  let output = 0;

  if (net) {

    if (!buffer[req.body.symbol]) {
      buffer[req.body.symbol] = [];
    }

    const diff1 = shared.getPipDiff(req.body.point, req.body.open, req.body.close);
    const diff2 = shared.getPipDiff(req.body.point, req.body.min, req.body.max);

    buffer[req.body.symbol].push(diff1);
    buffer[req.body.symbol].push(diff2);

    if (buffer[req.body.symbol].length === config.bars * 2) {
      const result = net.run([...buffer[req.body.symbol]]);

      buffer[req.body.symbol].shift();
      buffer[req.body.symbol].shift();

      console.log(result.buy, result.sell);

      if (result.buy > result.sell) {
        if (result.sell < 0.01) {
          output = result.buy;
        }
      } else {
        if (result.buy < 0.01) {
          output = result.sell * -1;
        }
      }
    }
  }

  res.send(String(output)).status(200);
});

function buildNetwork() {
  console.log('Train is initialized');
  net = new brain.NeuralNetwork();
  buffer = {};
  net.trainAsync(dataset)
    .then((res) => {
      onLoad();
      console.log(`Net trained in ${res.iterations} iterations.`);
    })
    .catch((error) => {
      console.error('Train error:', error);
    });
}

function scanFiles(data) {
  const src = base;
  let first;
  let symbol;
  let point;

  if (data) {
    if (!data.length) {
      console.log('Scan is done');
      return buildNetwork();
    }
    first = data.shift();
  } else {
    first = src.shift();
  }

  symbol = first.symbol;
  point = first.point;

  scan.init(
    symbol,
    point,
    (symbol, point, time, ask, bid) => onTick(symbol, point, time, ask, bid),
    (symbol, point, time, open, close, min, max) => onBar(symbol, point, time, open, close, min, max),
    () => scanFiles(data || src));
}

function onTarget(time, symbol, target) {

  if (lastPredictionTime) {
    const current = new Date(time);
    const last = new Date(lastPredictionTime);

    if (current.getHours() === last.getHours()) {
      return;
    }
  }

  dataset.push({
    input: target.data,
    output: target.prediction
  });

  lastPredictionTime = time;

  console.log(`${time} ${symbol}: ${dataset.length}`);
}

function onBar(symbol, point, time, open, close, min, max) {

  train.onTrainingBar(
    symbol,
    time,
    point,
    open,
    close,
    min,
    max);
}

function onTick(symbol, point, time, ask, bid) {

  train.onTrainingTickUp(
    point,
    bid,
    result => onTarget(time, symbol, result));

  train.onTrainingTickDown(
    point,
    ask,
    result => onTarget(time, symbol, result));
}

function onLoad() {
  app.listen(5000, () => console.log('Server is running'));
}

scanFiles();
