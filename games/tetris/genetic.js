"use strict";

const SpecializedBrain = (game, evaluator, config) => {

  const genes = [
     'cumulativeHeight',
     'holes',
     'roughness',
     'relativeHeight',
     'height'
  ];
  const getGenes = () => genes;

  const mutate = (genome) =>
    genes.forEach(key => {
      if (Math.random() < config.mutationRate) {
        genome[key] = genome[key] + config.mutationStep * (Math.random() * 2 - 1);
      }
    });

  const newRandomGenome = () =>
    genes.reduce((genome, key) => {
      genome[key] = Math.random() * 2 - 1;
      return genome;
    }, {});

  const newGenome = (genomes) => {
    let genome = clone(Random.weightedArrayElement(genomes));
    if (Math.random() < config.ratioChildrenToSingle) {
      genome = makeChild(genome, Random.weightedArrayElement(genomes));
    }
    mutate(genome);
    return genome;
  }

  /**
   * Creates a child genome from the given parent genomes, and then attempts to mutate the child genome.
   * @param  {Genome} mum The first parent genome.
   * @param  {Genome} dad The second parent genome.
   * @return {Genome}     The child genome.
   */
  const makeChild = (mum, dad) => {
    const child = { fitness: -1 };
    genes.forEach(key => child[key] = Random.oneInSet(mum[key], dad[key]));
    return child;
  }

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
    game.bagIndex(state.bagIndex);
    rndSeed = state.rndSeed;
    game.score(state.score);
  }

  const areIdenticalGenomes = (g1, g2) => !genes.some(key => g1[key] !== g2[key]);

  return {
    newRandomGenome,
    newGenome,
    getState,
    loadState,
    areIdenticalGenomes,
    getGenes,
  }
};
