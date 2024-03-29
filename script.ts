"use strict";

const AI_PLAYS = document.getElementById("aiGo") as HTMLButtonElement;
const NEW_GAME = document.getElementById("new-game") as HTMLButtonElement;
const gameCells = document.querySelectorAll(".cell") as NodeListOf<HTMLSpanElement>;
const WINNER = document.getElementById("winner") as HTMLParagraphElement;
const PRUNES = document.getElementById("prunes") as HTMLParagraphElement;
const EXPANDED = document.getElementById("expanded") as HTMLParagraphElement;
const PATH_LENGTH = document.getElementById("pathLength") as HTMLParagraphElement;

// O is obv the best piece. You can't change this
const aiMark = "X";
const humanMark = "O";

let gameOver = true;

gameCells.forEach( (c) => c.addEventListener("click", insertPlayersMark));

AI_PLAYS.addEventListener("click", computersTurn);
NEW_GAME.addEventListener("click", startNewGame);

function insertPlayersMark(event: PointerEvent) {
    if (!(event.target as HTMLParagraphElement).innerText && !gameOver && (event.target as HTMLParagraphElement).innerText == "") {
        (event.target as HTMLParagraphElement).innerText = humanMark;
        checkIfGameIsOver();

        if (!gameOver) {
            insertCompMark();
            checkIfGameIsOver();
        }
    }

}

function computersTurn() {
    insertCompMark();
    checkIfGameIsOver();
}

function startNewGame() {
    gameOver = false;
    gameCells.forEach( i => {
        i.innerText = "";
    });
    WINNER.innerText = "";
    AI_PLAYS.style.display = "block";
    NEW_GAME.style.display = "none";

	NEW_GAME.innerText = "Play Again"

    PRUNES.textContent = '';
    PATH_LENGTH.textContent = '';
    EXPANDED.textContent = '';
}

function getAllEmptyCellsIndexes(currBdState: BoardState): number[] {
    // Filter out cells that have pieces
    //@ts-expect-error
    return currBdState.filter(i => i != aiMark && i != humanMark);
}


interface NodeDescription {
    children?: | NodeDescription[];
    minimaxValue: number;
    index: number;
    player: 'AI' | 'HUMAN';
    passedInfo: [number, number];
}



type Pieces = 'X' | 'O';

type BoardState = (Pieces | number)[];



function checkIfIsWinner(currBdState: BoardState, mark: Pieces): boolean {
    if (    
        (currBdState[0] == mark && (
            currBdState[1] == mark && currBdState[2] == mark ||
            currBdState[3] == mark && currBdState[6] == mark ||
            currBdState[4] == mark && currBdState[8] == mark
        )) ||
        (currBdState[8] == mark && (
            currBdState[7] == mark && currBdState[6] == mark ||
            currBdState[5] == mark && currBdState[2] == mark
        )) ||
        (currBdState[4] == mark && (
            currBdState[1] == mark && currBdState[7] == mark ||
            currBdState[3] == mark && currBdState[5] == mark ||
            currBdState[2] == mark && currBdState[6] == mark
        ))
    ) {
      return true;
    } else {
      return false;
    }
}

function insertCompMark() {

    // Lets keep track of some stats why don't we
    let nodes_expanded = 0;
    let paths_pruned = 0;
    let worst_index = 9;

    function minimax(currBdState: BoardState, currMark: Pieces, lookIndex: number, alpha_beta: [number, number]): NodeDescription {
        // Keep in mind, currBdState will not (except for the beginning) be the state of the current board

		// Update stats
        worst_index = Math.min(worst_index, lookIndex);
        nodes_expanded++

        // First lets initialize what we will return
        const ret: NodeDescription = { children: [], minimaxValue: undefined, index: -1, player: currMark == humanMark ? 'HUMAN' : 'AI', passedInfo: alpha_beta };
        
        // Get the cells we have available to put things in
        const availableCellIndexes = getAllEmptyCellsIndexes(currBdState);
        
        // Check to see if the board we were given has a winner scenario
        // The score for the winner scenario is based on the depth into the search tree we are
        if (availableCellIndexes.length < 7){
            if (currMark == aiMark && checkIfIsWinner(currBdState, humanMark)) {
                ret.minimaxValue = -lookIndex;
                return ret;
            } else if (currMark == humanMark && checkIfIsWinner(currBdState, aiMark)) {
                ret.minimaxValue = lookIndex;
                return ret;
            } else if (availableCellIndexes.length == 0) {
				// Needs to be checked last, both this and the above could be true
                ret.minimaxValue = 0;
                return ret;
            }
        }

        // If we have made it this far, then we know that we have to start checking cells, ugh
        
        // Randomly select the spot we start at
        // This is all that move ordering stuff I'm not optimizing because it's naughts and crosses
        const randomStart = Math.floor(Math.random() * availableCellIndexes.length)

        
        // Test the chain of what happens if we place a mark on a space
        for (let i = 0; i < availableCellIndexes.length; i++) {

            // The second step of that randomization process thingy
            let j = (i + randomStart) % availableCellIndexes.length


            // Create a copy of the board state and add a mark to the cell of our choice
            const boardCopy = [...currBdState];
            boardCopy[availableCellIndexes[j]] = currMark


            
            if (currMark == aiMark) {

                // Ask the child for its opinion on our altered board state
                const result = minimax(boardCopy, humanMark, lookIndex - 1, [alpha_beta[0], Infinity]);
                result.index = availableCellIndexes[j];
                
                
                // Add this child to our bag of children for debugging purposes
                ret.children.push(result)


                // Update the alpha and best play, based on what it thinks. Hopefully our move was not shit
                if (result.minimaxValue > alpha_beta[0]) {
                    
                    alpha_beta[0] = result.minimaxValue;
                    ret.index = result.index;


                    // Now lets test to see if the pruning equation was violated
                    if (alpha_beta[0] >= alpha_beta[1]) {
                        // If we got here, the child really thinks the board we passed it was shit, and so do we. Blegh
                        // So now we need to adjust the minimax value of our ret value and return it
                        ret.minimaxValue = alpha_beta[0];

						// Prunes
                        paths_pruned++;
                        return ret;

                    }
                }
            } else {

                const result = minimax(boardCopy, aiMark, lookIndex - 1, [-Infinity, alpha_beta[1]]);
                result.index = availableCellIndexes[j];

                ret.children.push(result);

                if (result.minimaxValue < alpha_beta[1]) {
                    alpha_beta[1] = result.minimaxValue;
                    ret.index = result.index;

                    if (alpha_beta[0] >= alpha_beta[1]) {
                        ret.minimaxValue = alpha_beta[1];

						// Prunes
                        paths_pruned++;
                        return ret;
                    }
                }
            }
        }

        // If we made it here, we just need to return what we have

        ret.minimaxValue = currMark == aiMark ? alpha_beta[0] : alpha_beta[1];
        return ret
        
    }
    
    // Initialize the board state
    const currentBoardState: BoardState = [];
    
    // Store the values of the squares
    gameCells.forEach( (c, i) => {
        c.innerHTML ? currentBoardState.push(c.innerText as Pieces) : currentBoardState.push(i);
    });
    
	// Compute the best playable spot
    const bestPlayInfo = minimax(currentBoardState, aiMark, 9, [-Infinity, Infinity]);
    
    // Now that we know the best play info, lets play on that space
    gameCells[bestPlayInfo.index].innerText = aiMark;

    // Update stats
    PRUNES.textContent = `Paths Pruned: ${paths_pruned}`;
    EXPANDED.textContent = `Nodes Expanded: ${nodes_expanded}`;
    PATH_LENGTH.textContent = `Deepest Path: ${9 - worst_index}`;

}

function checkIfGameIsOver() {
    
    // Get the board state
    const currentBoardState = [];
    let emptyCells = 0;
    
    // Store the values of the squares
    gameCells.forEach( (c, i) => {
        if (c.textContent) {
            currentBoardState.push(c.innerText);
        } else {
            currentBoardState.push(i);
            emptyCells++;
        }
    });

    
    // First check if we have enough pieces on the board
    // Technically speaking, this could be < 5, but what if you want the AI to go multiple times?
    if (emptyCells > 6) return;

    if (checkIfIsWinner(currentBoardState, aiMark)) {
        WINNER.innerText = "AI Win!";
        gameOver = true;
        NEW_GAME.style.display = "block";
        AI_PLAYS.style.display = "none";
    } else if (checkIfIsWinner(currentBoardState, humanMark)) {
        WINNER.innerText = "Hmmm...Human Win...Sus";
        gameOver = true;
        NEW_GAME.style.display = "block";
        AI_PLAYS.style.display = "none";
    } else if (emptyCells == 0) {
        // If there are no empty cells and the above checks failed, then the game is over
        WINNER.innerText = "Draw!";
        gameOver = true;
        NEW_GAME.style.display = "block";
        AI_PLAYS.style.display = "none";
    }

}