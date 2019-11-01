"use strict";

const Random = {};

Random.numberBetween = (min, max) => ~~(Math.random() * (max - min + 1)) + min;

/**
* Returns a random property from the given object.
* @param  {Object} obj The object to select a property from.
* @return {Property}     A random property.
*/
Random.property = (obj) => obj[Random.key(obj)];

/**
 * Returns a random property key from the given object.
 * @param  {Object} obj The object to select a property key from.
 * @return {Property}     A random property key.
 */
Random.key = (obj) => {
  const keys = Object.keys(obj);
  const i = Random.numberBetween(0, keys.length - 1); // this.seeded can be used for deterministic outcome

  return keys[i];
};

Random.arrayElement = arr => arr[Random.numberBetween(0, arr.length - 1)];
Random.weightedIndex = arr => {
  const arrayWeight = arr.length * (arr.length - 1) / 2;
  let weightedIndex = Random.numberBetween(0, arrayWeight);
  for (let i = arr.length; weightedIndex >= i; i--) {
    weightedIndex = weightedIndex - i;
  }
  return weightedIndex;
};
Random.weightedArrayElement = arr => arr[Random.weightedIndex(arr)];

/**
 * Returns a random number that is determined from a seeded random number generator.
 * @param  {Number} min The minimum number, inclusive.
 * @param  {Number} max The maximum number, exclusive.
 * @return {Number}     The generated random number.
 */
Random.seeded = (min, max) => {
  max = max || 1;
  min = min || 0;

  rndSeed = (rndSeed * 9301 + 49297) % 233280;
  const rnd = rndSeed / 233280;

  return ~~(min + rnd * (max - min));
};

Random.oneInSet = function (...set) {
  const index = ~~(Math.random() * set.length);
  return set[index];
};
Random.weightedNumBetween = (min, max) => ~~(Math.pow(Math.random(), 2) * (max - min + 1) + min);
Random.shuffleArray = array => array.map((a) => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
Random.normalDistribution = (min, max, skew) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
  num = Math.pow(num, skew); // Skew
  num *= max - min; // Stretch to fill range
  num += min; // offset to min
  return num;
}