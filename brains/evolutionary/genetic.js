"use strict";

let genomeId = 0;

const Brain = (config = {}) => {
  const game = config.game;
  const evaluator = config.evaluator;
  // ratio of fittest genomes to survive the generation
  config.ratioFittestToSurvive = config.ratioFittestToSurvive || 0.1;
  // ratio of brand new genomes
  config.ratioBrandNewGenomes = config.ratioBrandNewGenomes || 0.05;
  // ratio of newGenomes compared to single mutation
  config.ratioChildrenToSingle = config.ratioChildrenToSingle || 0.7;
  // rate of mutation
  config.mutationRate = config.mutationRate || 0.4;
  // helps calculate mutation
  config.mutationStep = config.mutationStep || 0.1;

  // Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
  let rndSeed = config.rndSeed || Random.intNumberBetween(0, 1000); // 1;

  //GAME VALUES
  //stores current game state
  let roundState;

  //GENETIC ALGORITHM VALUES
  //stores values for a generation
  let archive = {
    populationSize: 0,
    currentGeneration: 0,
    elites: [],
    genomes: []
  };

  const newRandomGenome = () => {
    const genome = specializedBrain.newRandomGenome();
    genome.id = genomeId++;
    genome.fitness = -1;
    return genome;
  }

  /**
   * Creates the initial population of genomes, each with random genes.
   */
  const createInitialPopulation = () => {
    genomes = [];
    for (let i = 0; i < populationSize; i++) {
      const genome = newRandomGenome();
      genomes.push(genome);
    }
  }

  /**
   * Evolves the entire population and goes to the next generation.
   */
  const evolve = () => {

    genomeIndex = 0;
    generation++;
    reset();
    //gets the current game state
    roundState = specializedBrain.getState();
    // Sort genomes from fittest to weakest
    genomes.sort((a, b) => b.fitness - a.fitness);
    // Save a copy of the fittest genome to the elites list
    archive.elites.push(clone(genomes[0]));

    // Log last generation data
    console.log("Generation " + generation + " evaluated.");
    console.log("Elite's id & fitness: #" + genomes[0].id + " - " + genomes[0].fitness);
    console.log("Average fitness: " + genomes.reduce((sum, g) => sum = sum + g.fitness, 0) / genomes.length);
    console.log(clone(genomes));

    // Create new population
    let newGenomes = [];
    // Transmit the x% fittest genome to the new generation
    for (let i = 0; i < genomes.length * config.ratioFittestToSurvive; i++) {
      newGenomes.push(clone(genomes[i]));
    }

    // Keep best third and a fourth of the remaining unfit to generate next generation
    genomes = genomes.filter((_g, i) => (i < (populationSize / 3)) || !Random.intNumberBetween(0, 4));

    // Add brand new genomes for diversity
    for (let i = 0; i < genomes.length * config.ratioBrandNewGenomes; i++) {
      const genome = newRandomGenome();
      newGenomes.push(genome);
    }

    // Fill population with mix and / or mutations of previous genomes
    while (newGenomes.length < populationSize) {
      const genome = specializedBrain.newGenome(genomes);
      if (!genomesIncludes(genome)) {
        genome.id = genomeId++;
        newGenomes.push(genome);
      }
    }

    // Initialize newGenomes fitness for next occurence
    // Should it have a memory of previous performances?
    newGenomes.forEach(c => c.fitness = -1);

    // Populate genomes with newGenomes
    genomes = [...newGenomes];

    // Store this genomes set
    archive.genomes = clone(genomes);
    archive.currentGeneration = generation;
    localStorage.setItem("archive", JSON.stringify(archive));
  }

  const genomesIncludes = (genome) => genomes.some(g => specializedBrain.areIdenticalGenomes(g, genome));

  /**
   * Evaluates the next genome in the population. If there is none, evolves the population.
   */
  const evaluateNextGenome = () => {
    genomeIndex++;
    // If reached the last one, evolves the genomes population
    if (genomeIndex >= genomes.length) {
      evolve();
    }
    // Load current gamestate
    specializedBrain.loadState(roundState);
  }

  /**
   * Returns an array of all the possible moves that could occur in the current state, rated by the parameters of the current genome.
   * @return {Array} An array of all the possible moves that could occur.
   */
  // TODO extraire dans game
  function getAllPossibleMoves() {
    let lastState = specializedBrain.getState();
    const possibleMoves = [];

    //for each possible rotation
    for (let rotations = 0; rotations < 4; rotations++) {

      let oldX = [];
      const transitionLimit = Math.ceil(game.gameWidth / 2);
      //for each iteration
      for (let translation = -transitionLimit; translation <= game.gameWidth - transitionLimit; translation++) {
        specializedBrain.loadState(lastState);
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

          // Set the genome algorithm
          const algorithm = {};
          let rating = 0;
          specializedBrain.getGenes().forEach(key => {
            const val = evaluator[key](game);
            rating += val * genomes[genomeIndex][key];
            algorithm[key] = val;
          });

          // If lost, lower the rating (the only way to end tetris is by losing)
          if (moveDownResults.end) {
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
    specializedBrain.loadState(lastState);
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
  // TODO extraire le traitement specifique a tetris
  function makeNextMove() {
    //update this genome's fitness value using the game score
    genomes[genomeIndex].fitness = game.score();

    //get all the possible moves
    let possibleMoves = getAllPossibleMoves();
    //lets store the current state since we will update it
    let lastState = specializedBrain.getState();

    // TODO ne devrait pas connaitre ca (depend du jeu)
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
    specializedBrain.loadState(lastState);
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

  /**
   * Loads the archive given.
   * @param  {String} archiveString The stringified archive.
   */
  const loadArchive = (archiveString) => {
    archive = JSON.parse(archiveString);
    genomes = clone(archive.genomes);
    populationSize = archive.populationSize;
    generation = archive.currentGeneration;
    genomeIndex = 0;
    reset();
    roundState = specializedBrain.getState();
    console.log("Archive loaded!");
  }

  // Called on load
  const initialize = function () {
    archive.populationSize = populationSize;

    // Set both save state and current state from the game
    roundState = specializedBrain.getState();

    // Create an initial population of genomes
    createInitialPopulation();

    // Select the first genome
    evaluateNextGenome();
  };

  const getConfig = () => config;

  return {
    initialize,
    evaluateNextGenome,
    makeNextMove,
    loadArchive,
    getConfig,
  }
};