"use strict";

const SpecializedBrain = (game, evaluator, config) => {

  const genes = [
    'cumulativeHeight',
    'holes',
    'roughness',
    'relativeHeight',
    'height'
  ];

  const mutate = (genome, rate, step) =>
    genes.forEach(key => {
      if (Math.random() < rate) {
        genome[key] = genome[key] + step * (Math.random() * 2 - 1);
      }
    });

  const newRandomGenome = () =>
    Object.keys(evaluator).reduce((genome, key) => {
      genome[key] = Math.random() - 0.5;
      return genome;
    }, {});

  const newGenome = (genomes) => {
    let genome = clone(Random.weightedArrayElement(genomes));
    if (Math.random() < config.ratioChildrenToSingle) {
      genome = makeChild(genome, Random.weightedArrayElement(genomes));
    }
    mutate(genome, config.mutationRate, config.mutationStep);
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

  return {
    newRandomGenome,
    newGenome,
  }
};
