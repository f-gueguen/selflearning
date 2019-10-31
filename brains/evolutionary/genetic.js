"use strict";

let genomeId = 0;

const Brain = (config) => {
  const game = config.game;
  const evaluator = config.evaluator;
  // ratio of fittest genomes to survive the generation
  const ratioFittestToSurvive = config.ratioFittestToSurvive || 0.1;
  // ratio of brand new genomes
  const ratioBrandNewGenomes = config.ratioBrandNewGenomes || 0.05;
  // ratio of children compared to single mutation
  const ratioChildrenToSingle = config.ratioChildrenToSingle || 0.7;
  // rate of mutation
  const mutationRate = config.mutationRate || 0.2;
  // helps calculate mutation
  const mutationStep = config.mutationStep || 0.1;

  // Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
  let rndSeed = config.rndSeed || Random.numberBetween(0, 1000); // 1;

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

  /**
   * Returns the current game state in an object.
   * @return {State} The current game state.
   */
  const getState = () => clone({
    grid: game.grid(),
    currentShape: game.currentShape(),
    upcomingShape: game.upcomingShape() || 0,
    bag: game.bag(),
    bagIndex: game.bagIndex(),
    rndSeed,
    score: game.score()
  });

  /**
   * Loads the game state from the given state object.
   * @param  {State} state The state to load.
   */
  const loadState = (state) => {
    game.grid(clone(state.grid));
    game.currentShape(clone(state.currentShape));
    game.upcomingShape(clone(state.upcomingShape));
    game.bag(clone(state.bag));
    game.bagIndex(clone(state.bagIndex));
    rndSeed = clone(state.rndSeed);
    game.score(clone(state.score));
  }

  const createRandomGenome = () =>
    Object.keys(evaluator).reduce((genome, key) => {
      genome[key] = Math.random() - 0.5;
      return genome;
    }, { id: genomeId++, fitness: -1, });

  /**
   * Creates the initial population of genomes, each with random genes.
   */
  const createInitialPopulation = () => {
    genomes = [];
    for (let i = 0; i < populationSize; i++) {
      const genome = createRandomGenome();
      genomes.push(genome);
    }
  }

  /**
   * Evolves the entire population and goes to the next generation.
   */
  const evolve = () => {
    console.log("Generation " + generation + " evaluated.");

    currentGenome = 0;
    generation++;
    reset();
    //gets the current game state
    roundState = getState();
    //sorts genomes in decreasing order of fitness values
    genomes.sort((a, b) => (b.fitness - a.fitness));
    //add a copy of the fittest genome to the elites list
    archive.elites.push(clone(genomes[0]));
    console.log("Elite's fitness: " + genomes[0].fitness);

    // Keep first tier and a fourth of the remaining unfit
    genomes = genomes.filter((_g, i) => i < (populationSize / 3) || !Random.numberBetween(0, 4));

    // Create new population
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
      let genome = clone(getRandomGenome());
      if (Math.random() < ratioChildrenToSingle) {
        genome = makeChild(genome, getRandomGenome());
        // Decrement because will be incremented again in mutateGenome
        genomeId--;
      }
      mutateGenome(genome);
      children.push(genome);
    }

    // Populate genomes with children
    genomes = [...children];
    // Store this genomes set
    archive.genomes = clone(genomes);
    archive.currentGeneration = clone(generation);
    console.log(JSON.stringify(archive));
    localStorage.setItem("archive", JSON.stringify(archive));
  }

  /**
   * Evaluates the next genome in the population. If there is none, evolves the population.
   */
  const evaluateNextGenome = () => {
    //increment index in genome array
    currentGenome++;
    //If there is none, evolves the population.
    if (currentGenome === genomes.length) {
      evolve();
    }
    //load current gamestate
    loadState(roundState);
  }

  // Returns a random genome from the population
  const getRandomGenome = () => genomes[Random.weightedNumBetween(0, genomes.length - 1)];

  const mutateGenome = (genome) =>
    Object.keys(genome).forEach(key => {
      if (key === 'id') {
        genome.id = genomeId++;
      } else if (key !== 'fitness') {
        if (Math.random() < mutationRate) {
          genome[key] = genome[key] + mutationStep * (Math.random() * 2 - 1);
        }
      }
    });

  /**
   * Creates a child genome from the given parent genomes, and then attempts to mutate the child genome.
   * @param  {Genome} mum The first parent genome.
   * @param  {Genome} dad The second parent genome.
   * @return {Genome}     The child genome.
   */
  const makeChild = (mum, dad) => {
    const child = { id: genomeId++, fitness: -1 };
    Object.keys(mum).forEach(key => {
      if (!['fitness', 'id'].includes(key)) {
        child[key] = Random.oneInSet(mum[key], dad[key]);
      }
    });
    return child;
  }

  /**
   * Returns an array of all the possible moves that could occur in the current state, rated by the parameters of the current genome.
   * @return {Array} An array of all the possible moves that could occur.
   */
  // TODO extraire dans game
  function getAllPossibleMoves() {
    let lastState = getState();
    const possibleMoves = [];

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
          const algorithm = {};
          let rating = 0;
          Object.keys(evaluator).forEach(key => {
            const val = evaluator[key](game);
            rating += val * genomes[currentGenome][key];
            algorithm[key] = val;
          });

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
    //update this genome's fitness value using the game score
    genomes[currentGenome].fitness = game.score();

    //get all the possible moves
    let possibleMoves = getAllPossibleMoves();
    //lets store the current state since we will update it
    let lastState = getState();

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

  /**
   * Loads the archive given.
   * @param  {String} archiveString The stringified archive.
   */
  const loadArchive = (archiveString) => {
    archive = JSON.parse(archiveString);
    genomes = clone(archive.genomes);
    populationSize = archive.populationSize;
    generation = archive.currentGeneration;
    currentGenome = 0;
    reset();
    roundState = getState();
    console.log("Archive loaded!");
  }

  // Called on load
  const initialize = function () {
    archive.populationSize = populationSize;

    // Set both save state and current state from the game
    roundState = getState();

    // Create an initial population of genomes
    createInitialPopulation();

    // Select the first genome
    evaluateNextGenome();
  };

  return {
    initialize,
    evaluateNextGenome,
    makeNextMove,
    getState,
    loadState,
    loadArchive,
  }
};