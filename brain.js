"use strict";

let game = Game({ gameHeight: 15, gameWidth: 10 });
let evaluator = Evaluator(game);
let view = View(game);
let brain = Brain({ game, evaluator });

// Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
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


// TODO deplacer dans brain et afficher les stats par le brain
//stores genomes
let genomes = [];
//generation number
let generation = 0;
//index of current genome in genomes array
let currentGenome = -1;
//stores number of genomes, init at 50 
let populationSize = 50;

// main function, called on load
let initialize = function () {
  game.initialize();
  brain.initialize();

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
    loadJSON("./archive.json", brain.loadArchive);
    return false;
  }

  let characterPressed = String.fromCharCode(event.keyCode);
  if (characterPressed.toUpperCase() === "Q") {
    saveState = brain.getState();
  } else if (characterPressed.toUpperCase() === "W") {
    brain.loadState(saveState);
  } else if (characterPressed.toUpperCase() === "D") {
    speedDown();
  } else if (characterPressed.toUpperCase() === "E") {
    speedUp();
  } else if (characterPressed.toUpperCase() === "A") {
    //Turn on/off AI
    toggleAi();
  } else if (characterPressed.toUpperCase() === "R") {
    //load saved generation values
    brain.loadArchive(prompt("Insert archive:"));
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
 * Updates the game.
 */
function update() {
  //move the shape down
  let results = game.moveDown();
  //if we have our AI turned on and the current genome is nonzero
  if (ai /* && currentGenome !== -1*/) {
    //if that didn't do anything
    if (!results.moved) {
      //if we lost
      if (results.lose) {
        //move on to the next genome
        // TODO renommer pour quelque chose de plus generique
        brain.evaluateNextGenome();
      } else {
        //if we didnt lose, make the next move
        brain.makeNextMove();
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
