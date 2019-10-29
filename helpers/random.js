/**
 * Returns a random property from the given object.
 * @param  {Object} obj The object to select a property from.
 * @return {Property}     A random property.
 */
const randomProperty = (obj) => obj[randomKey(obj)];

/**
 * Returns a random property key from the given object.
 * @param  {Object} obj The object to select a property key from.
 * @return {Property}     A random property key.
 */
const randomKey = (obj) => {
  const keys = Object.keys(obj);
  const i = randomBetween(0, keys.length - 1); // seededRandom can be used for deterministic outcome

  return keys[i];
}

/**
 * Returns a random number that is determined from a seeded random number generator.
 * @param  {Number} min The minimum number, inclusive.
 * @param  {Number} max The maximum number, exclusive.
 * @return {Number}     The generated random number.
 */
const seededRandom = (min, max) => {
  max = max || 1;
  min = min || 0;

  rndSeed = (rndSeed * 9301 + 49297) % 233280;
  const rnd = rndSeed / 233280;

  return ~~(min + rnd * (max - min));
}

const randomChoice = (propOne, propTwo) => clone(~~(Math.random() * 2) ? propOne : propTwo);

const randomWeightedNumBetween = (min, max) => ~~(Math.pow(Math.random(), 2) * (max - min + 1) + min);

const randomBetween = (min, max) => ~~(Math.random() * (max - min + 1)) + min;

const shuffleArray = array => array.map((a) => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);