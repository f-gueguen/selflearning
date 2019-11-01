"use strict";

const Game = (config = {}) => {
  const gameHeight = config.gameHeight || 20;
  const gameWidth = config.gameWidth || 10;

  // Game this.score
  let _score = 0;
  const score = score => {
    if (score !== undefined) {
      _score = score;
    }
    return _score;
  };

  // Grid game
  let _grid = undefined;
  const grid = grid => {
    if (grid !== undefined) {
      _grid = grid;
    }
    return _grid;
  };

  //Block shapes
  const shapes = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
    L: [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
    O: [[4, 4], [4, 4]],
    S: [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
    T: [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
    Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
  };

  const clearRowScore = [0, 400, 1000, 3000, 12000];

  //coordinates and shape parameter of current block we can update
  let _currentShape = { x: 0, y: 0, shape: undefined };
  const currentShape = currentShape => {
    if (currentShape !== undefined) {
      _currentShape = currentShape;
    }
    return _currentShape;
  };

  //store shape of upcoming block
  let _upcomingShape;
  const upcomingShape = upcomingShape => {
    if (upcomingShape !== undefined) {
      _upcomingShape = upcomingShape;
    }
    return _upcomingShape;
  };

  //stores shapes
  let _bag = [];
  const bag = bag => {
    if (bag !== undefined) {
      _bag = bag;
    }
    return _bag;
  };

  //index for shapes in the _bag
  let _bagIndex = 0;
  const bagIndex = bagIndex => {
    if (bagIndex !== undefined) {
      _bagIndex = bagIndex;
    }
    return _bagIndex;
  };

  const reset = () => {
    _score = 0;
    resetGrid();
    nextShape();
  };

  const resetGrid = () => {
    _grid = [];
    for (let i = 0; i < gameHeight; i++) {
      _grid[i] = [];
      for (let j = 0; j < gameWidth; j++) {
        _grid[i][j] = 0;
      }
    }
  };

  const control = (event, characterPressed) => {
    if (event.keyCode === 38) {
      rotateShape();
    } else if (event.keyCode === 40) {
      moveDown();
    } else if (event.keyCode === 37) {
      moveLeft();
    } else if (event.keyCode === 39) {
      moveRight();
    } else if (shapes[characterPressed.toUpperCase()] !== undefined) {
      removeShape();
      _currentShape.shape = shapes[characterPressed.toUpperCase()];
      applyShape();
    } else {
      return false;
    }
    return true;
  };

  /**
   * Moves the current shape to the left if possible.
   */
  const moveLeft = () => {
    removeShape();
    _currentShape.x--;
    if (collides(_grid, _currentShape)) {
      _currentShape.x++;
    }
    applyShape();
  };

  /**
   * Moves the current shape to the right if possible.
   */
  const moveRight = () => {
    removeShape();
    _currentShape.x++;
    if (collides(_grid, _currentShape)) {
      _currentShape.x--;
    }
    applyShape();
  };

  /**
   * Moves the current shape down if possible.
   * @return {Object} The results of the movement of the piece.
   */
  const moveDown = () => {
    let result = { end: false, moved: true };

    //remove the shape, because we will draw a new one
    removeShape();
    // move it down
    _currentShape.y++;

    if (collides(_grid, _currentShape)) {
      // If collides, cancel its move
      _currentShape.y--;
      // Apply it to the _grid
      applyShape();
      // Move on to the next shape in the _bag
      nextShape();
      // Clear rows if needed
      clearRows();

      // If the new shape collides, we lose
      if (collides(_grid, _currentShape)) {
        result.end = true;
        reset();
      }
      result.moved = false;
    } else {
      applyShape();
      _score++;
    }
    return result;
  };

  /**
   * Rotates the current shape clockwise if possible.
   */
  //slide it if we can, else return to original rotation
  const rotateShape = () => {
    removeShape();
    _currentShape.shape = rotate(_currentShape.shape, 1);
    if (collides(_grid, _currentShape)) {
      _currentShape.shape = rotate(_currentShape.shape, 3);
    }
    applyShape();
  };

  /**
   * Clears any rows that are filled
   */
  const clearRows = () => {
    //empty array for rows to clear
    const rowsToClear = [];
    //for each row in the _grid
    for (let row = 0; row < _grid.length; row++) {
      const containsEmptySpace = _grid[row].some(v => v === 0);
      if (!containsEmptySpace) {
        // Memorize the row if it's filled
        rowsToClear.push(row);
      }
    }
    // Add score depending on number of rows cleared
    _score += clearRowScore[rowsToClear.length];

    //for each value
    for (let toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
      //remove the row from the _grid
      _grid.splice(rowsToClear[toClear], 1);
    }
    //shift the other rows
    while (_grid.length < gameHeight) {
      _grid.unshift(new Array(gameWidth).fill(0));
    }
  };

  /**
   * Applies the current shape to the _grid.
   */
  const applyShape = () => {
    //for each value in the current shape (row x column)
    for (let row = 0; row < _currentShape.shape.length; row++) {
      for (let col = 0; col < _currentShape.shape[row].length; col++) {
        //if its non-empty
        if (_currentShape.shape[row][col] !== 0) {
          //set the value in the _grid to its value. Stick the shape in the _grid!
          _grid[_currentShape.y + row][_currentShape.x + col] =
            _currentShape.shape[row][col];
        }
      }
    }
  };

  /**
   * Removes the current shape from the _grid.
   */
  //same deal but reverse
  const removeShape = () => {
    for (let row = 0; row < _currentShape.shape.length; row++) {
      for (let col = 0; col < _currentShape.shape[row].length; col++) {
        if (_currentShape.shape[row][col] !== 0) {
          _grid[_currentShape.y + row][_currentShape.x + col] = 0;
        }
      }
    }
  };

  /**
   * Cycles to the next shape in the _bag
   * Tetris usually come with a bag of the 7 tetrominos shuffled
   */
  const nextShape = () => {
    //increment the _bag index
    _bagIndex = (_bagIndex + 1) % _bag.length;
    //if we're at the beginning the _bag, generate a new bag
    if (_bag.length === 0) {
      generateBag();
    }
    // TODO avoir un bag 2 fois plus grand et reapprovisionner quand la moitie est partie?
    //if almost at end of _bag
    if (_bagIndex === _bag.length - 1) {
      //generate upcoming shape
      _upcomingShape = Random.property(shapes);
    } else {
      //get the next shape from our _bag
      _upcomingShape = shapes[_bag[_bagIndex + 1]];
    }
    //get our current shape from the _bag
    _currentShape.shape = shapes[_bag[_bagIndex]];
    // Define its position
    // ~~ optimize Math.floor, -~ optimize Math.ceil (on positive numbers)
    _currentShape.x = ~~(_grid[0].length / 2) - -~(_currentShape.shape[0].length / 2);
    _currentShape.y = 0;
  };

  /**
   * Generates the _bag of shapes.
   */
  const generateBag = () => {
    _bag = Random.shuffleArray(Object.keys(shapes));
    _bagIndex = 0;
  };

  /**
   * Determines if the given _grid and shape collide with one another.
   * @param  {Grid} scene  The _grid to check.
   * @param  {Shape} object The shape to check.
   * @return {Boolean} Whether the shape and _grid collide.
   */
  const collides = (scene, object) => {
    //for the size of the shape (row x column)
    for (let row = 0; row < object.shape.length; row++) {
      for (let col = 0; col < object.shape[row].length; col++) {
        //if its not empty
        if (object.shape[row][col] !== 0) {
          //if it collides, return true
          if (
            scene[object.y + row] === undefined ||
            scene[object.y + row][object.x + col] === undefined ||
            scene[object.y + row][object.x + col] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Rotate a shape
  const rotate = (matrix, times = 1) => {
    for (let t = 0; t < times; t++) {
      matrix = transpose(matrix);
      // for the length of the matrix, reverse each column
//      for (let i = 0; i < matrix.length; i++) {
//        matrix[i].reverse();
//      }
    }
    return matrix;
  };

  const step = moveDown;

  const initialize = function () {
    reset();
  };

  // public
  return {
    gameHeight,
    gameWidth,
    score,
    grid,
    currentShape,
    upcomingShape,
    bag,
    bagIndex,
    reset,
    control,
    moveLeft,
    moveRight,
    moveDown,
    rotateShape,
    //clearRows: clearRows,
    applyShape,
    removeShape,
    nextShape,
    // interface
    initialize,
    step,
    // TODO ajouter ensemble de coups autorises?
    moves: {

    }
  };
};
