"use strict";

const Game = (config = {}) => {
  const gameHeight = config.gameHeight || 10;
  const gameWidth = config.gameWidth || 10;
  const maxPoints = gameHeight * gameWidth;
  const pointsQuantity = Math.min(config.pointsQuantity || gameHeight * gameWidth, maxPoints);
  let _points = [];

  const initialize = () => {
    const grid = {};
    // Generate unique points on the grid
    for (let i = 0; i < pointsQuantity; i++) {
      const x = Random.intNumberBetween(0, gameHeight);
      grid[x] = grid[x] || [];
      let y;
      do {
        y = Random.intNumberBetween(0, gameHeight);
      } while (grid[x].includes(y));
      grid[x].push(y);
    }
    // Extract those unique points from the grid
    Object.keys(grid).forEach(
      x => grid[x].forEach(
        y => _points.push({ x, y })
      ));
  }

  const score = () => {
    const data = _points.reduce((acc, point) => ({
      len: acc.len + Point.distance2D(acc.point, point),
      point
    }),
      { len: 0, point: _points.slice(-1)[0] });
    return pointsQuantity / data.len;
  }

  // TODO
  const step = () => ({ end: true, moved: true });

  const points = points => {
    if (points !== undefined) {
      _points = points;
    }
    return _points;
  };
  const grid = points;

  return {
    gameWidth,
    gameHeight,
    initialize,
    points,
    grid,
    score,
    step,
  }
};