const config = require('./config');
const shared = require('./shared');
const bufferPips = [];
const bufferSlotUp = [];
const bufferSlotDown = [];

function onTrainingBar(symbol, time, point, open, close, min, max) {
  const diff1 = shared.getPipDiff(point, open, close);
  const diff2 = shared.getPipDiff(point, min, max);

  bufferPips.push(diff1);
  bufferPips.push(diff2);

  if (bufferPips.length === config.bars * 2) {
    const src = [...bufferPips];

    bufferPips.shift();
    bufferPips.shift();

    bufferSlotUp.push({
      symbol: symbol,
      data: src,
      time: time
    });

    bufferSlotDown.push({
      symbol: symbol,
      data: src,
      time: time
    });

  }
}

function onTrainingTickUp(point, bid, callback) {
  const toRemove = [];

  for (let i = 0; i < bufferSlotUp.length; i++) {

    if (!bufferSlotUp[i].price) {
      bufferSlotUp[i].price = bid;
      bufferSlotUp[i].tp = bid + config.tp * point;
      bufferSlotUp[i].sl = bid - config.sl * point;
      continue;
    }

    if (bid >= bufferSlotUp[i].tp) {
      bufferSlotUp[i].prediction = { buy: 1 };
      callback(bufferSlotUp[i]);
      toRemove.push(i);
    }

    if (bid <= bufferSlotUp[i].sl) {
      toRemove.push(i);
    }

  }

  for (let j = 0; j < toRemove.length; j++) {
    bufferSlotUp.splice(toRemove[j], 1);
  }

}

function onTrainingTickDown(point, ask, callback) {
  const toRemove = [];

  for (let i = 0; i < bufferSlotDown.length; i++) {

    if (!bufferSlotDown[i].price) {
      bufferSlotDown[i].price = ask;
      bufferSlotDown[i].tp = ask - config.tp * point;
      bufferSlotDown[i].sl = ask + config.sl * point;
      continue;
    }

    if (ask <= bufferSlotDown[i].tp) {
      bufferSlotDown[i].prediction = { sell: 1 };
      callback(bufferSlotDown[i]);
      toRemove.push(i);
    }

    if (ask >= bufferSlotDown[i].sl) {
      toRemove.push(i);
    }

  }

  for (let j = 0; j < toRemove.length; j++) {
    bufferSlotDown.splice(toRemove[j], 1);
  }

}

module.exports.onTrainingBar = onTrainingBar;
module.exports.onTrainingTickUp = onTrainingTickUp;
module.exports.onTrainingTickDown = onTrainingTickDown;
