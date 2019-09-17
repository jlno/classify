# classify

Build a classificator and run the neural netword to found profitable patterns, consumes via http request in your bot.

## Provider
<a href="https://dukascopy.com">Dukascopy - JForex</a>

## Data
Put csv files into `./input` folder.

## Settings
* base.json
* config.js
```javascript
module.exports.bars = 3;
module.exports.tp = 50;
module.exports.sl = 20;
```
