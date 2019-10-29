"use strict";

const View = (game) => {
  //Block colors
  let colors = ["F92338", "C973FF", "1C76BC", "FEE356", "53D504", "36E0FF", "F8931D"];

  /**
   * Outputs the state to the screen.
   */
  const displayGame = () => {
    let grid = game.grid();
    let output = document.getElementById("output");
    let space = "&nbsp;";
    let html = "let tetris = [";
    let gridHtml = "";
    for (let i = 0; i < grid.length; i++) {
        gridHtml += "<br />" + space+ space + "[" + grid[i] + "]";
    }
    // apply style
    gridHtml = replaceAll(gridHtml, "(0)", "_");
    gridHtml = replaceAll(gridHtml, "(,)", "|");
    gridHtml = replaceAll(gridHtml, "([0-9]+)", "<i class='char_$1'>$1</i>");

    html += gridHtml;
    html += "<br />];";

    output.innerHTML = html;
  }

  /**
   * Updates the side information.
   */
  const displayData = () => {
    let upcomingShape = game.upcomingShape();
    let scoreDetails = document.getElementById("score");
    let html = "<h2>Score: " + game.score() + "</h2>";
    html += "<b>--Next--</b>";
    for (let i = 0; i < upcomingShape.length; i++) {
      let next = replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
      html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
    }
    for (let l = 0; l < 4 - upcomingShape.length; l++) {
      html += "<br />";
    }
    for (let c = 0; c < colors.length; c++) {
      html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
      html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
    }
    html += "<br />Speed: " + speeds[speedIndex];
    if (ai) {
      html += "<br />Move: " + movesTaken + "/" + moveLimit;
      html += "<br />Generation: " + generation;
      html += "<br />Individual: " + (currentGenome + 1) + "/" + populationSize;
      html += "<br /><pre>" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
    }
    html = replaceAll(html, ",", "&nbsp;");
    scoreDetails.innerHTML = html;
  }

  return {
    displayGame,
    displayData,
  };
};
