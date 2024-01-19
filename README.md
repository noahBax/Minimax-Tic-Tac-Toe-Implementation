# Minimax-Tic-Tac-Toe-Implementation
A simple implementation to help me better understand how both minimax and alpha-beta pruning work. I needed to understand this for my Intro to AI class. No this was not required, I'm just a masochist apparently.

Live demo: https://noahbaxley.com/MinimaxTicTacToe/

I originally followed this tutorial: https://codesweetly.com/minimax-algorithm, but honestly it sucks because it doesn't prioritize shorter paths and the way it's written makes it hard to implement alpha-beta pruning.
I include it only for credit and giving me a starting point, but my code differs greatly outside of function names from the code there.

My resulting algorithm targets what it thinks is the shortest path to assured victory as determined by the minimax measure.
It is not the fastest gunman in the wild west, but implementing pruning definitely helped with the speed.

Feel free to play around with the code or take the minimax and alpha-beta pruning functions I have as they should be general purpose with a little modification I think.
I'd appreciate some credit though if you end up using this for a school project of your own or something like that. 
