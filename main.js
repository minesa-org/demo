import Game from "./js/Game.js";

async function main() {
    const game = new Game();
    game.init();
    game.createPlayer("paladin");
    game.start();
}

main();
