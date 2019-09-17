const slot = {
  price: undefined,
  tp: undefined,
  sl: undefined,
  prediction: undefined,
  data: undefined
};

function getPipDiff(point, a, b) {
  return Math.round(((a - b) / point) * -1);
}

module.exports.slot = slot;
module.exports.getPipDiff = getPipDiff;
