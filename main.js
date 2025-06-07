import Game from "./js/Game.js";

async function main() {
    const game = new Game();
    await game.init();
    game.createPlayer("paladin");
    await game.createGoblins(); // Create goblins after player is created
    game.start();
}

main();
