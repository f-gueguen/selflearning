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
    generateBag();
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

  const onkeydown = function (event, characterPressed) {
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
    //remove current shape, slide it over, if it collides though, slide it back
    removeShape();
    _currentShape.x--;
    if (collides(_grid, _currentShape)) {
      _currentShape.x++;
    }
    //apply the new shape
    applyShape();
  };

  /**
   * Moves the current shape to the right if possible.
   */
  const moveRight = function () {
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
    //array of possibilities
    let result = { lose: false, moved: true, rowsCleared: 0 };
    //remove the shape, because we will draw a new one
    removeShape();
    //move it down the y axis
    _currentShape.y++;
    //if it collides with the _grid
    if (collides(_grid, _currentShape)) {
      //update its position
      _currentShape.y--;
      //apply (stick) it to the _grid
      applyShape();
      //move on to the next shape in the _bag
      nextShape();
      //clear rows and get number of rows cleared
      result.rowsCleared = clearRows();

      //check again if this shape collides with our _grid
      if (collides(_grid, _currentShape)) {
        //reset
        result.lose = true;
        reset();
      }
      result.moved = false;
    }
    //apply shape and update the score
    applyShape();
    _score++;
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
   * Clears any rows that are completely filled.
   */
  const clearRows = function () {
    //empty array for rows to clear
    const rowsToClear = [];
    //for each row in the _grid
    for (let row = 0; row < _grid.length; row++) {
      let containsEmptySpace = false;
      //for each column
      for (let col = 0; col < _grid[row].length; col++) {
        //if its empty
        if (_grid[row][col] === 0) {
          //set this value to true
          containsEmptySpace = true;
        }
      }
      //if none of the columns in the row were empty
      if (!containsEmptySpace) {
        //add the row to our list, it's completely filled!
        rowsToClear.push(row);
      }
    }
    //increase this.score for up to 4 rows. it maxes out at 12000
    if (rowsToClear.length === 1) {
      _score += 400;
    } else if (rowsToClear.length === 2) {
      _score += 1000;
    } else if (rowsToClear.length === 3) {
      _score += 3000;
    } else if (rowsToClear.length >= 4) {
      _score += 12000;
    }
    //new array for cleared rows
    let rowsCleared = clone(rowsToClear.length);
    //for each value
    for (let toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
      //remove the row from the _grid
      _grid.splice(rowsToClear[toClear], 1);
    }
    //shift the other rows
    while (_grid.length < gameHeight) {
      _grid.unshift(new Array(gameWidth).fill(0));
    }
    //return the rows cleared
    return rowsCleared;
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
   * Cycles to the next shape in the _bag.
   */
  const nextShape = () => {
    //increment the _bag index
    _bagIndex += 1;
    //if we're at the start or end of the _bag
    if (_bag.length === 0 || _bagIndex === _bag.length) {
      //generate a new _bag of genomes
      generateBag();
    }
    //if almost at end of _bag
    if (_bagIndex === _bag.length - 1) {
      //store previous seed
      let prevSeed = rndSeed;
      //generate upcoming shape
      _upcomingShape = randomProperty(shapes);
      //set random seed
      rndSeed = prevSeed;
    } else {
      //get the next shape from our _bag
      _upcomingShape = shapes[_bag[_bagIndex + 1]];
    }
    //get our current shape from the _bag
    _currentShape.shape = shapes[_bag[_bagIndex]];
    //define its position
    _currentShape.x =
      Math.floor(_grid[0].length / 2) -
      Math.ceil(_currentShape.shape[0].length / 2);
    _currentShape.y = 0;
  };

  /**
   * Generates the _bag of shapes.
   */
  const generateBag = () => {
    _bag = [];
    let contents = "";
    //7 shapes
    for (let i = 0; i < 7; i++) {
      //generate shape randomly
      let shape = randomKey(shapes);
      while (contents.indexOf(shape) !== -1) {
        shape = randomKey(shapes);
      }
      //update _bag with generated shape
      _bag[i] = shape;
      contents += shape;
    }
    //reset _bag index
    _bagIndex = 0;
  };

  /**
   * Determines if the given _grid and shape collide with one another.
   * @param  {Grid} scene  The _grid to check.
   * @param  {Shape} object The shape to check.
   * @return {Boolean} Whether the shape and _grid collide.
   */
  const collides = function (scene, object) {
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

  //for rotating a shape, how many times should we rotate
  const rotate = function (matrix, times) {
    //for each time
    for (let t = 0; t < times; t++) {
      //flip the shape matrix
      matrix = transpose(matrix);
      //and for the length of the matrix, reverse each column
      for (let i = 0; i < matrix.length; i++) {
        matrix[i].reverse();
      }
    }
    return matrix;
  };

  const initialize = function () {
    resetGrid();
    //get the next available shape from the bag
    nextShape();
    //applies the shape to the grid
    applyShape();
  };

  //flip row x column to column x row
  const transpose = (array) =>
    array[0].map((col, i) =>
      array.map((row) => row[i]
      )
    );

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
    reset: reset.bind(this),
    onkeydown: onkeydown.bind(this),
    moveLeft: moveLeft.bind(this),
    moveRight: moveRight.bind(this),
    moveDown: moveDown.bind(this),
    rotateShape: rotateShape.bind(this),
    //clearRows: clearRows,
    applyShape: applyShape.bind(this),
    removeShape: removeShape.bind(this),
    nextShape: nextShape.bind(this),
    //generateBag: generateBag,
    // interface
    initialize: initialize.bind(this)
  };
};
