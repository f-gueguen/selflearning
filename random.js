/**
 * Returns a random property from the given object.
 * @param  {Object} obj The object to select a property from.
 * @return {Property}     A random property.
 */
function randomProperty(obj) {
    return(obj[randomKey(obj)]);
}

/**
 * Returns a random property key from the given object.
 * @param  {Object} obj The object to select a property key from.
 * @return {Property}     A random property key.
 */
function randomKey(obj) {
    var keys = Object.keys(obj);
    var i = seededRandom(0, keys.length);
    return keys[i];
}

/**
 * Returns a random number that is determined from a seeded random number generator.
 * @param  {Number} min The minimum number, inclusive.
 * @param  {Number} max The maximum number, exclusive.
 * @return {Number}     The generated random number.
 */
function seededRandom(min, max) {
    max = max || 1;
    min = min || 0;

    rndSeed = (rndSeed * 9301 + 49297) % 233280;
    var rnd = rndSeed / 233280;

    return Math.floor(min + rnd * (max - min));
}

function randomChoice(propOne, propTwo) {
    if (Math.round(Math.random()) === 0) {
        return clone(propOne);
    } else {
        return clone(propTwo);
    }
}

function randomWeightedNumBetween(min, max) {
    return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
}

function randomNumBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}