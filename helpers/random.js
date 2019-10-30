"use strict";

const numberBetween = (min, max) => ~~(Math.random() * (max - min + 1)) + min;

const Random = {
  /**
 * Returns a random property from the given object.
 * @param  {Object} obj The object to select a property from.
 * @return {Property}     A random property.
 */
  property: (obj) => obj[Random.key(obj)],

  /**
   * Returns a random property key from the given object.
   * @param  {Object} obj The object to select a property key from.
   * @return {Property}     A random property key.
   */
  key: (obj) => {
    const keys = Object.keys(obj);
    const i = numberBetween(0, keys.length - 1); // this.seeded can be used for deterministic outcome

    return keys[i];
  },

  /**
   * Returns a random number that is determined from a seeded random number generator.
   * @param  {Number} min The minimum number, inclusive.
   * @param  {Number} max The maximum number, exclusive.
   * @return {Number}     The generated random number.
   */
  seeded: (min, max) => {
    max = max || 1;
    min = min || 0;

    rndSeed = (rndSeed * 9301 + 49297) % 233280;
    const rnd = rndSeed / 233280;

    return ~~(min + rnd * (max - min));
  },

  oneInSet: function (...set) {
    const index = ~~(Math.random() * set.length);
    return set[index];
  },

  weightedNumBetween: (min, max) => ~~(Math.pow(Math.random(), 2) * (max - min + 1) + min),

  numberBetween,

  shuffleArray: array => array.map((a) => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map((a) => a[1]),
};
