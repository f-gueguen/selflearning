"use strict";

const Evaluator = (game) => {

  /**
   * Returns the cumulative height of all the columns.
   * @return {Number} The cumulative height.
   */
  const cumulativeHeight = () => {
    game.removeShape();
    const peaks = new Array(game.gameWidth).fill(game.gameHeight);
    for (let row = 0; row < game.grid().length; row++) {
      for (let col = 0; col < game.grid()[row].length; col++) {
        if (game.grid()[row][col] !== 0 && peaks[col] === game.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    let totalHeight = 0;
    for (let i = 0; i < peaks.length; i++) {
      totalHeight += game.gameHeight - peaks[i];
    }
    game.applyShape();
    return totalHeight;
  };

  /**
   * Returns the number of holes in the game.grid().
   * @return {Number} The number of holes.
   */
  let holes = () => {
    game.removeShape();
    const peaks = new Array(game.gameWidth).fill(game.gameHeight);
    for (let row = 0; row < game.grid().length; row++) {
      for (let col = 0; col < game.grid()[row].length; col++) {
        if (game.grid()[row][col] !== 0 && peaks[col] === game.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    let holes = 0;
    for (let x = 0; x < peaks.length; x++) {
      for (let y = peaks[x]; y < game.grid().length; y++) {
        if (game.grid()[y][x] === 0) {
          holes++;
        }
      }
    }
    game.applyShape();
    return holes;
  };

  /**
   * Returns an array that replaces all the holes in the game.grid() with -1.
   * @return {Array} The modified game.grid() array.
   */
  const holesArray = () => {
    const array = clone(game.grid());
    game.removeShape();
    const peaks = new Array(game.gameWidth).fill(game.gameHeight);
    for (let row = 0; row < game.grid().length; row++) {
      for (let col = 0; col < game.grid()[row].length; col++) {
        if (game.grid()[row][col] !== 0 && peaks[col] === game.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    for (let x = 0; x < peaks.length; x++) {
      for (let y = peaks[x]; y < game.grid().length; y++) {
        if (game.grid()[y][x] === 0) {
          array[y][x] = -1;
        }
      }
    }
    game.applyShape();
    return array;
  };

  /**
   * Returns the roughness of the game.grid().
   * @return {Number} The roughness of the game.grid().
   */
  const roughness = () => {
    game.removeShape();
    let peaks = new Array(game.gameWidth).fill(game.gameHeight);
    for (let row = 0; row < game.grid().length; row++) {
      for (let col = 0; col < game.grid()[row].length; col++) {
        if (game.grid()[row][col] !== 0 && peaks[col] === game.gameHeight) {
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
    game.applyShape();
    return roughness;
  };

  /**
   * Returns the range of heights of the columns on the game.grid().
   * @return {Number} The relative height.
   */
  const relativeHeight = () => {
    game.removeShape();
    const peaks = new Array(game.gameWidth).fill(game.gameHeight);
    for (let row = 0; row < game.grid().length; row++) {
      for (let col = 0; col < game.grid()[row].length; col++) {
        if (game.grid()[row][col] !== 0 && peaks[col] === game.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    game.applyShape();
    return Math.max(...peaks) - Math.min(...peaks);
  };

  /**
   * Returns the height of the biggest column on the game.grid().
   * @return {Number} The absolute height.
   */
  const height = () => {
    game.removeShape();
    const peaks = new Array(game.gameWidth).fill(game.gameHeight);
    for (let row = 0; row < game.grid().length; row++) {
      for (let col = 0; col < game.grid()[row].length; col++) {
        if (game.grid()[row][col] !== 0 && peaks[col] === game.gameHeight) {
          peaks[col] = row;
        }
      }
    }
    game.applyShape();
    return game.gameHeight - Math.min(...peaks);
  };

  return {
    cumulativeHeight,
    holes,
    // holesArray,
    roughness,
    relativeHeight,
    height,
  };
};
