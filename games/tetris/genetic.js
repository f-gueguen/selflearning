"use strict";

const SpecializedBrain = (game, evaluator) => {
  
  const createRandomGenome = () =>
    Object.keys(evaluator).reduce((genome, key) => {
      genome[key] = Math.random() - 0.5;
      return genome;
    }, { id: genomeId++, fitness: -1, });

    return {
      createRandomGenome,
    }
};
