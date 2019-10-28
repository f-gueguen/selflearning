"use strict";

let game = Tetris();
let evaluator = Evaluator(game);

//Block colors
let colors = ["F92338", "C973FF", "1C76BC", "FEE356", "53D504", "36E0FF", "F8931D"];

//Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
let rndSeed = 1;


//GAME VALUES
// game speed
let speed = 500;
// boolean for changing game speed
let changeSpeed = false;
//for storing current state, we can load later
let saveState;
//stores current game state
let roundState;
//list of available game speeds
let speeds = [500, 100, 1, 0];
//inded in game speed array
let speedIndex = 0;
//turn ai on or off
let ai = true;
//drawing game vs updating algorithms
let draw = true;
//how many so far?
let movesTaken = 0;
//max number of moves allowed in a generation
let moveLimit = 500;
//consists of move the 7 move parameters
let moveAlgorithm = {};
//set to highest rate move 
let inspectMoveSelection = false;

//GENETIC ALGORITHM VALUES
//stores number of genomes, init at 50 
let populationSize = 50;
//stores genomes
let genomes = [];
//index of current genome in genomes array
let currentGenome = -1;
//generation number
let generation = 0;
//stores values for a generation
let archive = {
  populationSize: 0,
  currentGeneration: 0,
  elites: [],
  genomes: []
};
//rate of mutation
let mutationRate = 0.05;
//helps calculate mutation
let mutationStep = 0.2;


//main function, called on load
let initialize = function () {
  //init pop size
  archive.populationSize = populationSize;

  // initialize game
  game.initialize();

  //set both save state and current state from the game
  saveState = getState();
  roundState = getState();
  //create an initial population of genomes
  createInitialPopulation();
  //the game loop
  let loop = function () {
    //boolean for changing game speed
    if (changeSpeed) {
      //restart the clock
      //stop time
      clearInterval(interval);
      //set time, like a digital watch
      interval = setInterval(loop, speed);
    }
    // if speed is 0, don't draw. otherwise, draw elements
    draw = speed !== 0;

    //updates the game (update fitness, make a move, evaluate next move)
    update();
    if (speed === 0) {
      // update the score
      updateScore(true);
    }
  };
  //timer interval
  let interval = setInterval(loop, speed);
};
document.onLoad = initialize();

function switchAi() {
  ai = !ai;
}

//key options
window.onkeydown = function (event) {

  let characterPressed = String.fromCharCode(event.keyCode);
  if (characterPressed.toUpperCase() === "Q") {
    saveState = getState();
  } else if (characterPressed.toUpperCase() === "W") {
    loadState(saveState);
  } else if (characterPressed.toUpperCase() === "D") {
    //slow down
    speedIndex--;
    if (speedIndex < 0) {
      speedIndex = speeds.length - 1;
    }
    speed = speeds[speedIndex];
    changeSpeed = true;
  } else if (characterPressed.toUpperCase() === "E") {
    //speed up
    speedIndex++;
    if (speedIndex >= speeds.length) {
      speedIndex = 0;
    }
    //adjust speed index
    speed = speeds[speedIndex];
    changeSpeed = true;
  } else if (characterPressed.toUpperCase() === "A") {
    //Turn on/off AI
    switchAi();
  } else if (characterPressed.toUpperCase() === "R") {
    //load saved generation values
    loadArchive(prompt("Insert archive:"));
  } else if (characterPressed.toUpperCase() === "G") {
    if (localStorage.getItem("archive") === null) {
      alert("No archive saved. Archives are saved after a generation has passed, and remain across sessions. Try again once a generation has passed");
    } else {
      prompt("Archive from last generation (including from last session):", localStorage.getItem("archive"));
    }
    //    } else if (characterPressed.toUpperCase() === "F") {
    //        //?
    //        inspectMoveSelection = !inspectMoveSelection;
  } else if (!ai && game.onkeydown(event, characterPressed)) {
    return true;
  }
  return false;
};

/**
 * Creates the initial population of genomes, each with random genes.
 */
function createInitialPopulation() {
  //inits the array
  genomes = [];
  //for a given population size
  for (let i = 0; i < populationSize; i++) {
    //randomly initialize the 7 values that make up a genome
    //these are all weight values that are updated through evolution
    let genome = {
      //unique identifier for a genome
      id: Math.random(),
      //The weight of each row cleared by the given move. the more rows that are cleared, the more this weight increases
      rowsCleared: Math.random() - 0.5,
      //the absolute height of the highest column to the power of 1.5
      //added so that the algorithm can be able to detect if the blocks are stacking too high
      weightedHeight: Math.random() - 0.5,
      //The sum of all the column’s heights
      cumulativeHeight: Math.random() - 0.5,
      //the highest column minus the lowest column
      relativeHeight: Math.random() - 0.5,
      //the sum of all the empty cells that have a block above them (basically, cells that are unable to be filled)
      holes: Math.random() * 0.5,
      // the sum of absolute differences between the height of each column 
      //(for example, if all the shapes on the grid lie completely flat, then the roughness would equal 0).
      roughness: Math.random() - 0.5
    };
    //add them to the array
    genomes.push(genome);
  }
  evaluateNextGenome();
}

/**
 * Evaluates the next genome in the population. If there is none, evolves the population.
 */
function evaluateNextGenome() {
  //increment index in genome array
  currentGenome++;
  //If there is none, evolves the population.
  if (currentGenome === genomes.length) {
    evolve();
  }
  //load current gamestate
  loadState(roundState);
  //reset moves taken
  movesTaken = 0;
}

/**
 * Evolves the entire population and goes to the next generation.
 */
function evolve() {

  console.log("Generation " + generation + " evaluated.");
  //reset current genome for new generation
  currentGenome = 0;
  //increment generation
  generation++;
  //resets the game
  reset();
  //gets the current game state
  roundState = getState();
  //sorts genomes in decreasing order of fitness values
  genomes.sort(function (a, b) {
    return b.fitness - a.fitness;
  });
  //add a copy of the fittest genome to the elites list
  archive.elites.push(clone(genomes[0]));
  console.log("Elite's fitness: " + genomes[0].fitness);

  //remove the tail end of genomes, focus on the fittest
  while (genomes.length > populationSize / 2) {
    genomes.pop();
  }
  //sum of the fitness for each genome
  let totalFitness = 0;
  for (let i = 0; i < genomes.length; i++) {
    totalFitness += genomes[i].fitness;
  }

  //get a random index from genome array
  function getRandomGenome() {
    return genomes[randomWeightedNumBetween(0, genomes.length - 1)];
  }
  //create children array
  let children = [];
  //add the fittest genome to array
  children.push(clone(genomes[0]));
  //add population sized amount of children
  while (children.length < populationSize) {
    //crossover between two random genomes to make a child
    children.push(makeChild(getRandomGenome(), getRandomGenome()));
  }
  //create new genome array
  genomes = [];
  //to store all the children in
  genomes = genomes.concat(children);
  //store this in our archive
  archive.genomes = clone(genomes);
  //and set current gen
  archive.currentGeneration = clone(generation);
  console.log(JSON.stringify(archive));
  //store archive, thanks JS localstorage! (short term memory)
  localStorage.setItem("archive", JSON.stringify(archive));
}

/**
 * Creates a child genome from the given parent genomes, and then attempts to mutate the child genome.
 * @param  {Genome} mum The first parent genome.
 * @param  {Genome} dad The second parent genome.
 * @return {Genome}     The child genome.
 */
function makeChild(mum, dad) {
  //init the child given two genomes (its 7 parameters + initial fitness value)
  let child = {
    //unique id
    id: Math.random(),
    //all these params are randomly selected between the mom and dad genome
    rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
    weightedHeight: randomChoice(mum.weightedHeight, dad.weightedHeight),
    cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
    relativeHeight: randomChoice(mum.relativeHeight, dad.relativeHeight),
    holes: randomChoice(mum.holes, dad.holes),
    roughness: randomChoice(mum.roughness, dad.roughness),
    //no fitness. yet.
    fitness: -1
  };
  //mutation time!

  //we mutate each parameter using our mutationstep
  if (Math.random() < mutationRate) {
    child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
  }
  if (Math.random() < mutationRate) {
    child.weightedHeight = child.weightedHeight + Math.random() * mutationStep * 2 - mutationStep;
  }
  if (Math.random() < mutationRate) {
    child.cumulativeHeight = child.cumulativeHeight + Math.random() * mutationStep * 2 - mutationStep;
  }
  if (Math.random() < mutationRate) {
    child.relativeHeight = child.relativeHeight + Math.random() * mutationStep * 2 - mutationStep;
  }
  if (Math.random() < mutationRate) {
    child.holes = child.holes + Math.random() * mutationStep * 2 - mutationStep;
  }
  if (Math.random() < mutationRate) {
    child.roughness = child.roughness + Math.random() * mutationStep * 2 - mutationStep;
  }
  return child;
}

/**
 * Returns an array of all the possible moves that could occur in the current state, rated by the parameters of the current genome.
 * @return {Array} An array of all the possible moves that could occur.
 */
function getAllPossibleMoves() {
  let lastState = getState();
  let possibleMoves = [];

  //for each possible rotation
  for (let rotations = 0; rotations < 4; rotations++) {

    let oldX = [];
    const transitionLimit = Math.ceil(game.gameWidth / 2);
    //for each iteration
    for (let translation = -transitionLimit; translation <= game.gameWidth - transitionLimit; translation++) {
      loadState(lastState);
      //rotate shape
      for (let j = 0; j < rotations; j++) {
        game.rotateShape();
      }
      //move left
      if (translation < 0) {
        for (let l = 0; l < Math.abs(translation); l++) {
          game.moveLeft();
        }
        //move right
      } else if (translation > 0) {
        for (let r = 0; r < translation; r++) {
          game.moveRight();
        }
      }
      //if the shape has moved at all
      let currentShape = game.currentShape();
      if (!contains(oldX, currentShape.x)) {
        //move it down
        let moveDownResults = game.moveDown();
        while (moveDownResults.moved) {
          moveDownResults = game.moveDown();
        }
        //set the 7 parameters of a genome
        let algorithm = {
          rowsCleared: moveDownResults.rowsCleared,
          weightedHeight: Math.pow(evaluator.getHeight(game), 1.5),
          cumulativeHeight: evaluator.getCumulativeHeight(game),
          relativeHeight: evaluator.getRelativeHeight(game),
          holes: evaluator.getHoles(game),
          roughness: evaluator.getRoughness(game)
        };
        //rate each move
        let rating = 0;
        rating += algorithm.rowsCleared * genomes[currentGenome].rowsCleared;
        rating += algorithm.weightedHeight * genomes[currentGenome].weightedHeight;
        rating += algorithm.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
        rating += algorithm.relativeHeight * genomes[currentGenome].relativeHeight;
        rating += algorithm.holes * genomes[currentGenome].holes;
        rating += algorithm.roughness * genomes[currentGenome].roughness;
        //if the move loses the game, lower its rating
        if (moveDownResults.lose) {
          rating -= 500;
        }
        //push all possible moves, with their associated ratings and parameter values to an array
        possibleMoves.push({ rotations, translation, rating, algorithm });
        //update the position of old X value
        oldX.push(currentShape.x);
      }
    }
  }
  //get last state
  loadState(lastState);
  //return array of all possible moves
  return possibleMoves;
}

/**
 * Returns the highest rated move in the given array of moves.
 * @param  {Array} moves An array of possible moves to choose from.
 * @return {Move}       The highest rated move from the moveset.
 */
function getHighestRatedMove(moves) {
  //start these values off small
  let maxRating = -10000000000000;
  //    let maxMove = -1;
  let ties = [];
  //iterate through the list of moves
  for (let index = 0; index < moves.length; index++) {
    //if the current moves rating is higher than our maxrating
    if (moves[index].rating > maxRating) {
      //update our max values to include this moves values
      maxRating = moves[index].rating;
      //            maxMove = index;
      //store index of this move
      ties = [index];
    } else if (moves[index].rating === maxRating) {
      //if it ties with the max rating
      //add the index to the ties array
      ties.push(index);
    }
  }
  //eventually we'll set the highest move value to this move let
  let move = moves[ties[0]];
  //and set the number of ties
  move.algorithm.ties = ties.length;
  return move;
}

/**
 * Makes a move, which is decided upon using the parameters in the current genome.
 */
function makeNextMove() {
  //increment number of moves taken
  movesTaken++;
  //if its over the limit of moves
  if (movesTaken > moveLimit) {
    //update this genomes fitness value using the game score
    genomes[currentGenome].fitness = clone(game.score());
    //and evaluates the next genome
    evaluateNextGenome();
  } else {
    // game make the next move
    //        game.nextMove();
    //time to make a move

    //we're going to re-draw, so lets store the old drawing
    let oldDraw = clone(draw);
    draw = false;
    //get all the possible moves
    let possibleMoves = getAllPossibleMoves();
    //lets store the current state since we will update it
    let lastState = getState();


    //whats the next shape to play
    game.nextShape();
    //for each possible move 
    for (let i = 0; i < possibleMoves.length; i++) {
      //get the best move. so were checking all the possible moves, for each possible move. moveception.
      let nextMove = getHighestRatedMove(getAllPossibleMoves());
      //add that rating to an array of highest rates moves
      possibleMoves[i].rating += nextMove.rating;
    }
    //load current state
    loadState(lastState);
    //get the highest rated move ever
    let move = getHighestRatedMove(possibleMoves);
    //then rotate the shape as it says too
    for (let rotations = 0; rotations < move.rotations; rotations++) {
      game.rotateShape();
    }
    //and move left as it says
    if (move.translation < 0) {
      for (let lefts = 0; lefts < Math.abs(move.translation); lefts++) {
        game.moveLeft();
      }
      //and right as it says
    } else if (move.translation > 0) {
      for (let rights = 0; rights < move.translation; rights++) {
        game.moveRight();
      }
    }


    //and set the old drawing to the current
    draw = oldDraw;
  }
}

/**
 * Updates the game.
 */
function update() {
  //move the shape down
  let results = game.moveDown();
  //if we have our AI turned on and the current genome is nonzero
  if (ai && currentGenome !== -1) {
    //if that didn't do anything
    if (!results.moved) {
      //if we lost
      if (results.lose) {
        //update the fitness
        genomes[currentGenome].fitness = clone(game.score());
        //move on to the next genome
        evaluateNextGenome();
      } else {
        //if we didnt lose, make the next move
        makeNextMove();
      }
    }
  }
  //output the state to the screen
  output();
  //and update the score
  updateScore();
}

/**
 * Resets the game.
 */
function reset() {
  movesTaken = 0;
  game.reset();
}

//flip row x column to column x row
function transpose(array) {
  return array[0].map(function (col, i) {
    return array.map(function (row) {
      return row[i];
    });
  });
}

/**
 * Outputs the state to the screen.
 */
function output() {
  if (draw) {
    let grid = game.grid();
    let output = document.getElementById("output");
    let html = "[";//"<h1>Gamer</h1>[";
    let space = "&nbsp;";//"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    let gridHtml = "";
    for (let i = 0; i < grid.length; i++) {
      if (i === 0) {
        gridHtml += "[" + grid[i] + "]";
      } else {
        gridHtml += "<br />" + space + "[" + grid[i] + "]";
      }
    }
    // apply style
    gridHtml = replaceAll(gridHtml, "(0)", "_");
    gridHtml = replaceAll(gridHtml, "(,)", "|");
    gridHtml = replaceAll(gridHtml, "([0-9]+)", "<i class='char_$1'>$1</i>");

    html += gridHtml;
    html += "];";

    output.innerHTML = html;
  }
}

/**
 * Updates the side information.
 * @param {bool} force force display
 */
function updateScore(force) {
  if (draw || force) {
    let upcomingShape = game.upcomingShape();
    let scoreDetails = document.getElementById("score");
    let html = "<h2>Score: " + game.score() + "</h2>";
    html += "<b>--Next--</b>";
    for (let i = 0; i < upcomingShape.length; i++) {
      let next = replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
      html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
    }
    for (let l = 0; l < 4 - upcomingShape.length; l++) {
      html += "<br />";
    }
    for (let c = 0; c < colors.length; c++) {
      html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
      html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
    }
    html += "<br />Speed: " + speed;
    if (ai) {
      html += "<br />Moves: " + movesTaken + "/" + moveLimit;
      html += "<br />Generation: " + generation;
      html += "<br />Individual: " + (currentGenome + 1) + "/" + populationSize;
      html += "<br /><pre>" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
      //            if (inspectMoveSelection) {
      //                html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(moveAlgorithm, null, 2) + "</pre>";
      //            }
    }
    html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
    scoreDetails.innerHTML = html;
  }
}

/**
 * Returns the current game state in an object.
 * @return {State} The current game state.
 */
function getState() {
  let state = {
    grid: clone(game.grid()),
    currentShape: clone(game.currentShape()),
    upcomingShape: clone(game.upcomingShape() || 0),
    bag: clone(game.bag()),
    bagIndex: clone(game.bagIndex()),
    rndSeed: clone(rndSeed),
    score: clone(game.score())
  };
  return state;
}

/**
 * Loads the game state from the given state object.
 * @param  {State} state The state to load.
 */
function loadState(state) {
  game.grid(clone(state.grid));
  game.currentShape(clone(state.currentShape));
  game.upcomingShape(clone(state.upcomingShape));
  game.bag(clone(state.bag));
  game.bagIndex(clone(state.bagIndex));
  rndSeed = clone(state.rndSeed);
  game.score(clone(state.score));
}

/**
 * Loads the archive given.
 * @param  {String} archiveString The stringified archive.
 */
function loadArchive(archiveString) {
  archive = JSON.parse(archiveString);
  genomes = clone(archive.genomes);
  populationSize = archive.populationSize;
  generation = archive.currentGeneration;
  currentGenome = 0;
  reset();
  roundState = getState();
  console.log("Archive loaded!");
}
