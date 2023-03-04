"use strict";
const PLAY_GAME = document.getElementById("play-btn");
const NEW_GAME = document.getElementById("new-game");
const gameCells = document.querySelectorAll(".cell");
const WINNER = document.getElementById("winner");
const PRUNES = document.getElementById("prunes");
const EXPANDED = document.getElementById("expanded");
const PATH_LENGTH = document.getElementById("pathLength");
const aiMark = "X";
const humanMark = "O";
let gameOver = true;
gameCells.forEach((c) => c.addEventListener("click", insertPlayersMark));
PLAY_GAME.addEventListener("click", playGame);
NEW_GAME.addEventListener("click", startNewGame);
function insertPlayersMark(event) {
    if (!event.target.innerText && !gameOver && event.target.innerText == "") {
        event.target.innerText = humanMark;
        checkIfGameIsOver();
        if (!gameOver) {
            insertCompMark();
            checkIfGameIsOver();
        }
    }
}
function playGame() {
    insertCompMark();
    checkIfGameIsOver();
}
function startNewGame() {
    gameOver = false;
    gameCells.forEach(i => {
        i.innerText = "";
        i.style.color = "#4b3621";
    });
    WINNER.innerText = "";
    PLAY_GAME.style.display = "block";
    NEW_GAME.style.display = "none";
    PRUNES.textContent = '';
    PATH_LENGTH.textContent = '';
    EXPANDED.textContent = '';
}
function getAllEmptyCellsIndexes(currBdState) {
    //@ts-ignore
    return currBdState.filter(i => i != "X" && i != "O");
}
var timer = 150;
function insertCompMark() {
    // Lets keep track of some stats why don't we
    let nodes_expanded = 0;
    let paths_pruned = 0;
    let worst_index = 9;
    function checkIfWinnerFound(currBdState, currMark) {
        if ((currBdState[0] == currMark && (currBdState[1] == currMark && currBdState[2] == currMark ||
            currBdState[3] == currMark && currBdState[6] == currMark ||
            currBdState[4] == currMark && currBdState[8] == currMark)) ||
            (currBdState[8] == currMark && (currBdState[7] == currMark && currBdState[6] == currMark || currBdState[5] == currMark && currBdState[2] == currMark)) ||
            (currBdState[4] == currMark && (currBdState[1] == currMark && currBdState[7] == currMark ||
                currBdState[3] == currMark && currBdState[5] == currMark ||
                currBdState[2] == currMark && currBdState[6] == currMark))) {
            return true;
        }
        else {
            return false;
        }
    }
    function minimax(currBdState, currMark, lookIndex, alpha_beta) {
        // Keep in mind, currBdState will not (except for the beginning) be the state of the current board
        worst_index = Math.min(worst_index, lookIndex);
        nodes_expanded++;
        // First lets initialize what we will return
        const ret = { children: [], minimaxValue: undefined, index: -1, player: currMark == "O" ? 'HUMAN' : 'AI', passedInfo: alpha_beta };
        // Get the cells we have available to put things in
        const availableCellIndexes = getAllEmptyCellsIndexes(currBdState);
        // Check to see if the board we were given has a winner scenario
        // The score for the winner scenario is based on the depth into the search tree we are
        if (availableCellIndexes.length < 7) {
            if (checkIfWinnerFound(currBdState, humanMark)) {
                ret.minimaxValue = -lookIndex;
                return ret;
            }
            else if (checkIfWinnerFound(currBdState, aiMark)) {
                ret.minimaxValue = lookIndex;
                return ret;
            }
            else if (availableCellIndexes.length == 0) {
                ret.minimaxValue = 0;
                return ret;
            }
        }
        // If we have made it this far, then we know that we have to start checking cells, ugh
        // Randomly select the spot we start at
        // This is all that move ordering stuff I'm not optimizing because it's naughts and crosses
        const randomStart = Math.floor(Math.random() * availableCellIndexes.length);
        // Test the chain of what happens if we place a mark on a space
        for (let i = 0; i < availableCellIndexes.length; i++) {
            // The second step of that randomization process thingy
            let j = (i + randomStart) % availableCellIndexes.length;
            // Create a copy of the board state and add a mark to the cell of our choice
            const boardCopy = [...currBdState];
            boardCopy[availableCellIndexes[j]] = currMark;
            if (currMark == aiMark) {
                // Ask the child for its opinion on our altered board state
                const result = minimax(boardCopy, humanMark, lookIndex - 1, [alpha_beta[0], Infinity]);
                result.index = availableCellIndexes[j];
                // Add this child to our bag of children for debugging purposes
                ret.children.push(result);
                // Update the alpha and best play, based on what it thinks. Hopefully our move was not shit
                if (result.minimaxValue > alpha_beta[0]) {
                    alpha_beta[0] = result.minimaxValue;
                    ret.index = result.index;
                    // Now lets test to see if the pruning equation was violated
                    if (alpha_beta[0] >= alpha_beta[1]) {
                        // If we got here, the child really thinks the board we passed it was shit, and so do we. Blegh
                        // So now we need to adjust the minimax value of our ret value and return it
                        ret.minimaxValue = alpha_beta[0];
                        paths_pruned++;
                        return ret;
                        // Haha, now we have killed its siblings
                    }
                }
            }
            else {
                // I'mma disable the comment section here. Read above lazy
                // Wait, who's lazy? You or me?
                const result = minimax(boardCopy, aiMark, lookIndex - 1, [-Infinity, alpha_beta[1]]);
                result.index = availableCellIndexes[j];
                ret.children.push(result);
                if (result.minimaxValue < alpha_beta[1]) {
                    alpha_beta[1] = result.minimaxValue;
                    ret.index = result.index;
                    if (alpha_beta[0] >= alpha_beta[1]) {
                        ret.minimaxValue = alpha_beta[1];
                        paths_pruned++;
                        return ret;
                    }
                }
            }
        }
        // If we made it here, we just need to return what we have
        // Our children liked what we gave them.
        // The metaphor kinda breaks down here
        ret.minimaxValue = currMark == aiMark ? alpha_beta[0] : alpha_beta[1];
        return ret;
    }
    // Get the board state
    const currentBoardState = [];
    // Store the values of the squares
    gameCells.forEach((c, i) => {
        c.innerHTML ? currentBoardState.push(c.innerText) : currentBoardState.push(i);
    });
    const bestPlayInfo = minimax(currentBoardState, aiMark, 9, [-Infinity, Infinity]);
    console.log(bestPlayInfo);
    // Now that we know the best play info, lets play on that space
    gameCells[bestPlayInfo.index].innerText = aiMark;
    // Update stats
    PRUNES.textContent = 'Paths Pruned:' + paths_pruned;
    EXPANDED.textContent = `Nodes Expanded: ${nodes_expanded - 1}`; // Minus 1 because the first time we run minimax is not an expansion
    PATH_LENGTH.textContent = `Deepest Path: ${9 - worst_index}`;
}
function checkIfGameIsOver() {
    // Get the board state
    const currentBoardState = [];
    let emptyCells = 0;
    // Store the values of the squares
    gameCells.forEach((c, i) => {
        if (c.textContent) {
            currentBoardState.push(c.innerText);
        }
        else {
            currentBoardState.push(i);
            emptyCells++;
        }
    });
    // First check if we have enough pieces on the board
    if (emptyCells > 6)
        return;
    // Check if there are no empty cells
    if (emptyCells == 0) {
        WINNER.innerText = "Draw!";
        gameOver = true;
        NEW_GAME.style.display = "block";
        PLAY_GAME.style.display = "none";
    }
    else if ((currentBoardState[0] == aiMark && (currentBoardState[1] == aiMark && currentBoardState[2] == aiMark ||
        currentBoardState[3] == aiMark && currentBoardState[6] == aiMark ||
        currentBoardState[4] == aiMark && currentBoardState[8] == aiMark)) ||
        (currentBoardState[8] == aiMark && (currentBoardState[7] == aiMark && currentBoardState[6] == aiMark ||
            currentBoardState[5] == aiMark && currentBoardState[2] == aiMark)) ||
        (currentBoardState[4] == aiMark && (currentBoardState[1] == aiMark && currentBoardState[7] == aiMark ||
            currentBoardState[3] == aiMark && currentBoardState[5] == aiMark ||
            currentBoardState[2] == aiMark && currentBoardState[6] == aiMark))) {
        WINNER.innerText = "AI Win!";
        gameOver = true;
        NEW_GAME.style.display = "block";
        PLAY_GAME.style.display = "none";
    }
    else if ((currentBoardState[0] == humanMark && (currentBoardState[1] == humanMark && currentBoardState[2] == humanMark || currentBoardState[3] == humanMark && currentBoardState[6] == humanMark)) ||
        (currentBoardState[8] == humanMark && (currentBoardState[7] == humanMark && currentBoardState[6] == humanMark || currentBoardState[5] == humanMark && currentBoardState[2] == humanMark)) ||
        (currentBoardState[4] == humanMark && (currentBoardState[1] == humanMark && currentBoardState[7] == humanMark ||
            currentBoardState[3] == humanMark && currentBoardState[5] == humanMark ||
            currentBoardState[0] == humanMark && currentBoardState[8] == humanMark ||
            currentBoardState[2] == humanMark && currentBoardState[6] == humanMark))) {
        WINNER.innerText = "Human Win!";
        gameOver = true;
        NEW_GAME.style.display = "block";
        PLAY_GAME.style.display = "none";
    }
}
