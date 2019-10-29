"use strict";

let game = Game({ gameHeight: 15, gameWidth: 10 });
let evaluator = Evaluator(game);
let view = View(game);

//Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
let rndSeed = randomBetween(0, 1000); // 1;

//GAME VALUES
//for storing current state, we can load later
let saveState;
//stores current game state
let roundState;
//list of available game speeds
let speeds = [512, 256, 128, 1, 0];
//inded in game speed array
let speedIndex = 0;
// tag when changing the speed
let changeSpeed = false;
//turn ai on or off
let ai = true;
//how many so far?
let movesTaken = 0;
//max number of moves allowed in a generation
let moveLimit = 2000;
//consists of move the 7 move parameters
let moveAlgorithm = {};
// percentage of fittest genomes to survive the generation
let ratioFittestToSurvive = 0.15;
// ratio of brand new genomes
let ratioBrandNewGenomes = 0.1;

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
      interval = setInterval(loop, speeds[speedIndex]);
    }

    //updates the game (update fitness, make a move, evaluate next move)
    update();
    // update the score
    view.displayData();
  };
  //timer interval
  let interval = setInterval(loop, speeds[speedIndex]);
};
document.onLoad = initialize();

function toggleAi() {
  ai = !ai;
}

function speedUp() {
  speedIndex = (speedIndex + 1) % speeds.length;
  changeSpeed = true;
}
function speedDown() {
  speedIndex = (speedIndex + speeds.length - 1) % speeds.length;
  changeSpeed = true;
}

//key options
window.onkeydown = function (event) {
  if (event.ctrlKey) {
    loadJSON("./archive.json", loadArchive);
    return false;
  }

  let characterPressed = String.fromCharCode(event.keyCode);
  if (characterPressed.toUpperCase() === "Q") {
    saveState = getState();
  } else if (characterPressed.toUpperCase() === "W") {
    loadState(saveState);
  } else if (characterPressed.toUpperCase() === "D") {
    speedDown();
  } else if (characterPressed.toUpperCase() === "E") {
    speedUp();
  } else if (characterPressed.toUpperCase() === "A") {
    //Turn on/off AI
    toggleAi();
  } else if (characterPressed.toUpperCase() === "R") {
    //load saved generation values
    loadArchive(prompt("Insert archive:"));
  } else if (characterPressed.toUpperCase() === "G") {
    if (localStorage.getItem("archive") === null) {
      alert("No archive saved. Archives are saved after a generation has passed, and remain across sessions. Try again once a generation has passed");
    } else {
      prompt("Archive from last generation (including from last session):", localStorage.getItem("archive"));
    }
  } else if (!ai && game.onkeydown(event, characterPressed)) {
    return true;
  }
  return false;
};

/**
 * Creates the initial population of genomes, each with random genes.
 */
function createInitialPopulation() {
  genomes = [];
  for (let i = 0; i < populationSize; i++) {
    const genome = createRandomGenome();
    genomes.push(genome);
  }
  evaluateNextGenome();
}

function createRandomGenome() {
  //these are all weight values that are updated through evolution
  return {
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
  genomes.sort((a, b) => (b.fitness - a.fitness));
  //add a copy of the fittest genome to the elites list
  archive.elites.push(clone(genomes[0]));
  console.log("Elite's fitness: " + genomes[0].fitness);

  //get a random index from genome array
  const getRandomGenome = () =>
    genomes[randomWeightedNumBetween(0, genomes.length - 1)];

  const removedGenomes = [];
  //remove the tail end of genomes, focus mostly on the fittest
  while (genomes.length > populationSize / 3) {
    removedGenomes.push(genomes.pop());
  }
  // Keep 1/4 of those unfit genomes for diversity
  const genomesToSave = removedGenomes.filter(() => !randomBetween(0, 4));
  genomes.concat(genomesToSave);

  //create children array
  let children = [];
  //add the x% fittest genome to array
  for (let i = 0; i < genomes.length * ratioFittestToSurvive; i++) {
    children.push(clone(genomes[i]));
  }

  // add brand new genomes for diversity
  for (let i = 0; i < genomes.length * ratioBrandNewGenomes; i++) {
    const genome = createRandomGenome();
    children.push(genome);
  }

  // Fill population with mix of previous genomes
  while (children.length < populationSize) {
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
  }

  //we mutate each parameter using our mutationstep
  if (Math.random() < mutationRate) {
    child.rowsCleared = child.rowsCleared + mutationStep * (Math.random() * 2 - 1);
  }
  if (Math.random() < mutationRate) {
    child.weightedHeight = child.weightedHeight + mutationStep * (Math.random() * 2 - 1);
  }
  if (Math.random() < mutationRate) {
    child.cumulativeHeight = child.cumulativeHeight + mutationStep * (Math.random() * 2 - 1);
  }
  if (Math.random() < mutationRate) {
    child.relativeHeight = child.relativeHeight + mutationStep * (Math.random() * 2 - 1);
  }
  if (Math.random() < mutationRate) {
    child.holes = child.holes + mutationStep * (Math.random() * 2 - 1);
  }
  if (Math.random() < mutationRate) {
    child.roughness = child.roughness + mutationStep * (Math.random() * 2 - 1);
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
      if (!oldX.includes(currentShape.x)) {
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
  let ties = [];
  //iterate through the list of moves
  for (let index = 0; index < moves.length; index++) {
    //if the current moves rating is higher than our maxrating
    if (moves[index].rating > maxRating) {
      //update our max values to include this moves values
      maxRating = moves[index].rating;
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

  //update this genome's fitness value using the game score
  genomes[currentGenome].fitness = game.score();

  if (movesTaken > moveLimit) {
    // if its over the limit of moves, evaluates the next genome
    evaluateNextGenome();
  } else {
    // make the next move

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
        //move on to the next genome
        evaluateNextGenome();
      } else {
        //if we didnt lose, make the next move
        makeNextMove();
      }
    }
  }
  // Refresh game board if not unlimited speed
  speeds[speedIndex] !== 0 && view.displayGame();
  // Refresh the score and stats view
  view.displayData();
}

/**
 * Resets the game.
 */
function reset() {
  movesTaken = 0;
  game.reset();
}

/**
 * Returns the current game state in an object.
 * @return {State} The current game state.
 */
function getState() {
  return {
    grid: clone(game.grid()),
    currentShape: clone(game.currentShape()),
    upcomingShape: clone(game.upcomingShape() || 0),
    bag: clone(game.bag()),
    bagIndex: game.bagIndex(),
    rndSeed,
    score: game.score()
  };
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
