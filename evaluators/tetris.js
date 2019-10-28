"use strict";

const Evaluator = (tetris) => {

  /**
   * Returns the cumulative height of all the columns.
   * @return {Number} The cumulative height.
   */
  const getCumulativeHeight = () => {
    tetris.removeShape();
    const peaks = new Array(tetris.gameWidth).fill(tetris.gameHeight);
    for (let row = 0; row < tetris.grid().length; row++) {
      for (let col = 0; col < tetris.grid()[row].length; col++) {
        if (tetris.grid()[row][col] !== 0 && peaks[col] === tetris.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    let totalHeight = 0;
    for (let i = 0; i < peaks.length; i++) {
      totalHeight += tetris.gameHeight - peaks[i];
    }
    tetris.applyShape();
    return totalHeight;
  };

  /**
   * Returns the number of holes in the tetris.grid().
   * @return {Number} The number of holes.
   */
  let getHoles = () => {
    tetris.removeShape();
    const peaks = new Array(tetris.gameWidth).fill(tetris.gameHeight);
    for (let row = 0; row < tetris.grid().length; row++) {
      for (let col = 0; col < tetris.grid()[row].length; col++) {
        if (tetris.grid()[row][col] !== 0 && peaks[col] === tetris.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    let holes = 0;
    for (let x = 0; x < peaks.length; x++) {
      for (let y = peaks[x]; y < tetris.grid().length; y++) {
        if (tetris.grid()[y][x] === 0) {
          holes++;
        }
      }
    }
    tetris.applyShape();
    return holes;
  };

  /**
   * Returns an array that replaces all the holes in the tetris.grid() with -1.
   * @return {Array} The modified tetris.grid() array.
   */
  const getHolesArray = () => {
    const array = clone(tetris.grid());
    tetris.removeShape();
    const peaks = new Array(tetris.gameWidth).fill(tetris.gameHeight);
    for (let row = 0; row < tetris.grid().length; row++) {
      for (let col = 0; col < tetris.grid()[row].length; col++) {
        if (tetris.grid()[row][col] !== 0 && peaks[col] === tetris.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    for (let x = 0; x < peaks.length; x++) {
      for (let y = peaks[x]; y < tetris.grid().length; y++) {
        if (tetris.grid()[y][x] === 0) {
          array[y][x] = -1;
        }
      }
    }
    tetris.applyShape();
    return array;
  };

  /**
   * Returns the roughness of the tetris.grid().
   * @return {Number} The roughness of the tetris.grid().
   */
  const getRoughness = () => {
    tetris.removeShape();
    let peaks = new Array(tetris.gameWidth).fill(tetris.gameHeight);
    for (let row = 0; row < tetris.grid().length; row++) {
      for (let col = 0; col < tetris.grid()[row].length; col++) {
        if (tetris.grid()[row][col] !== 0 && peaks[col] === tetris.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    let roughness = 0;
    let differences = [];
    for (let i = 0; i < peaks.length - 1; i++) {
      roughness += Math.abs(peaks[i] - peaks[i + 1]);
      differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
    }
    tetris.applyShape();
    return roughness;
  };

  /**
   * Returns the range of heights of the columns on the tetris.grid().
   * @return {Number} The relative height.
   */
  const getRelativeHeight = () => {
    tetris.removeShape();
    const peaks = new Array(tetris.gameWidth).fill(tetris.gameHeight);
    for (let row = 0; row < tetris.grid().length; row++) {
      for (let col = 0; col < tetris.grid()[row].length; col++) {
        if (tetris.grid()[row][col] !== 0 && peaks[col] === tetris.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    tetris.applyShape();
    return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
  };

  /**
   * Returns the height of the biggest column on the tetris.grid().
   * @return {Number} The absolute height.
   */
  const getHeight = () => {
    tetris.removeShape();
    const peaks = new Array(tetris.gameWidth).fill(tetris.gameHeight);
    for (let row = 0; row < tetris.grid().length; row++) {
      for (let col = 0; col < tetris.grid()[row].length; col++) {
        if (tetris.grid()[row][col] !== 0 && peaks[col] === tetris.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    tetris.applyShape();
    return tetris.gameHeight - Math.min.apply(Math, peaks);
  };

  const rating = () => {
    return {
      getCumulativeHeight: getCumulativeHeight(),
      getHoles: getHoles(),
      getHolesArray: getHolesArray(),
      getRoughness: getRoughness(),
      getRelativeHeight: getRelativeHeight(),
      getHeight: getHeighteeeeee(),
    }
  };

  return {
    getCumulativeHeight,
    getHoles,
    getHolesArray,
    getRoughness,
    getRelativeHeight,
    getHeight,
    rating,
  };
};
