"use strict";

const View = (game) => {
  let svg;
  const colorDots = '#000';
  const colorPath = '#444';
  const svgRatio = 20;

  /**
   * Outputs the state to the screen.
   */
  const displayGame = () => {
    const points = game.points();
    // Create a dot for each point to travel to
    let html = points.reduce(
      (html, point) => html + SVG.dot(point.x * svgRatio, point.y * svgRatio, 1, colorDots),
      '');
    // Add the path (before the dots so that the dots are visible)
    // Add the first element to close the circuit
    html = SVG.polygone(points.map(p => ({ x: p.x * svgRatio, y: p.y * svgRatio })), colorPath) + html;
    // Apply to the SVG
    svg.innerHTML = html;
  }

  /**
   * Updates the side information.
   */
  const displayData = () => {
    let scoreDetails = document.getElementById("score");
    let html = "<h2>Score: " + game.score() + "</h2>";
    scoreDetails.innerHTML = html;
  }

  const initialize = () => {
    const output = document.getElementById("output");
    output.innerHTML = `<svg viewBox="0 0 ${game.gameWidth * svgRatio} ${game.gameHeight * svgRatio}" version="1.1" xmlns="http://www.w3.org/2000/svg" id="svg"></svg>`;
    svg = document.getElementById('svg');
  };

  return {
    displayGame,
    displayData,
    initialize,
  };
};
