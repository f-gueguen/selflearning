"use strict";

let game = Game({ gameHeight: 15, gameWidth: 10 });
let evaluator = Evaluator(game);
let view = View(game);
let brain = Brain({ game, evaluator });
let specializedBrain = SpecializedBrain(game, evaluator, brain.getConfig());

// Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
let rndSeed = Random.numberBetween(0, 1000); // 1;

//GAME VALUES
//for storing current state, we can load later
let saveState;

// Game speed
let speeds = [512, 256, 128, 1, 0, 2048];
let speedIndex = 0;
const speedUp = () => speedIndex = ++speedIndex % speeds.length;
const speedDown = () => speedIndex = (--speedIndex + speeds.length) % speeds.length;


// Current move
let movesTaken = 0;
let moveLimit = 20000;


// TODO deplacer dans brain et afficher les stats par le brain
//stores genomes
let genomes = [];
let genomeIndex = -1;
//generation number
let generation = 0;
// Size of solution population to train
let populationSize = 50;

// Is AI enabled?
let ai = true;
const toggleAi = () => ai = !ai;


// Key control
window.onkeydown = function (event) {
  if (event.ctrlKey) {
    loadJSON("./archive.json", brain.loadArchive);
    return false;
  }

  const characterPressed = String.fromCharCode(event.keyCode);

  switch (characterPressed.toUpperCase()) {
    case 'Q': {
      saveState = brain.getState();
      break;
    }
    case 'W': {
      brain.loadState(saveState);
      break;
    }
    case 'D': {
      speedDown();
      break;
    }
    case 'E': {
      speedUp();
      break;
    }
    case 'A': {
      toggleAi();
      break;
    }
    case 'R': {
      //load saved generation values
      brain.loadArchive(prompt("Insert archive:"));
      break;
    }
    case 'G': {
      if (localStorage.getItem("archive") === null) {
        alert("No archive saved. Archives are saved after a generation has passed, and remain across sessions. Try again once a generation has passed");
      } else {
        prompt("Archive from last generation (including from last session):", localStorage.getItem("archive"));
      }
      break;
    }
    default: {
      if (!ai) {
        game.control(event, characterPressed);
      }
    }
  }
  // Stops propagation
  return false;
};

/**
 * Updates the game.
 */
function update() {
  /*
  TODO
  algo devrait etre:
  - appliquer coup suivant et moveTaken++
  - si perdu, genome suivant et moveTaken = 0
  */

  // Execute next game step (e.g. tetris would be move down)
  const results = game.step();

  if (ai) {
    if (movesTaken > moveLimit || results.end) {
      brain.evaluateNextGenome();
      movesTaken = 0;
    } else if (!results.moved) {
      brain.makeNextMove();
      movesTaken++;
    }
  }
  // Refresh game board if not unlimited speed
  speeds[speedIndex] !== 0 && view.displayGame();
  // Refresh the score and stats view
  view.displayData();
};

/**
 * Resets the game.
 */
function reset() {
  movesTaken = 0;
  game.reset();
}

// main function, called on load
let initialize = function () {
  game.initialize();
  view.initialize();
  brain.initialize();

  // Game main loop
  const loop = function () {
    // Play next game move, evaluate...
    update();
    setTimeout(loop, speeds[speedIndex]);
  };

  //timer interval
  setTimeout(loop, speeds[speedIndex]);
};
document.onLoad = initialize();
