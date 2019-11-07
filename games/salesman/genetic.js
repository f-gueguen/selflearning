"use strict";

const SpecializedBrain = (game, evaluator, config) => {

  const mutate = (path, step) => {
    // Step is a ratio between 0 and 1
    const length = path.length;
    for (let i = 0; i < length * step; i++) {
      const swap1 = Random.intNumberBetween(0, length - 1);
      const swap2 = Random.intNumberBetween(0, length - 1);
      // Swap 2 elements (modify the array)
      [path[swap1, path[swap2]]] = [path[swap2], path[swap1]];
    }
    return path;
  };

  const newRandomGenome = () => ({
    path: Random.shuffleArray([...game.points()]),
  });

  const newGenome = (genomes) => {
    let genome = clone(Random.weightedArrayElement(genomes));
    mutate(genome.path, config.mutationRate, config.mutationStep);
    genome.id = genomeId++;
    return genome;
  };

  /**
   * Returns the current game state in an object.
   * @return {State} The current game state.
   */
  const getState = () => clone({
    grid: game.grid(),
    rndSeed,
    score: game.score()
  });

  /**
   * Loads the game state from the given state object.
   * @param  {State} state The state to load.
   */
  const loadState = (state) => {
    game.grid(clone(state.grid));
    rndSeed = state.rndSeed;
    game.score(state.score);
  };

  const areIdenticalGenomes = (g1, g2) => !g1.path.some((e, i) => e !== ge.path[i]);

  return {
    newRandomGenome,
    newGenome,
    getState,
    loadState,
    areIdenticalGenomes,
  }
};
