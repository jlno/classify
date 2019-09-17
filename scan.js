const csv = require('csvtojson');

let open;
let close;
let min;
let max;

function init(symbol, point, onTick, onBar, callback) {
  csv({ output: 'line' })
    .fromFile(`./input/${symbol}.csv`)
    .subscribe((csvLine) => {
      const data = csvLine.split(',');
      const time = data[0];
      const ask = +data[1];
      const bid = +data[2];
      const hour = +time.slice(11, 13);

      if (hour === 0) {

        if (!open) {
          open = bid;
        } else {
          close = bid;
          onBar(symbol, point, time, open, close, min, max);
          open = bid;
          close = undefined;
          min = undefined;
          max = undefined;
        }

      }

      if (!open) {
        return;
      }

      if (!min) {
        min = bid;
      }

      if (!max) {
        max = bid;
      }

      if (bid < min) {
        min = bid;
      }

      if (bid > max) {
        max = bid;
      }

      onTick(symbol, point, time, ask, bid);

    }, (error) => {
      console.error(error);

    }, () => callback());
}

module.exports.init = init;
