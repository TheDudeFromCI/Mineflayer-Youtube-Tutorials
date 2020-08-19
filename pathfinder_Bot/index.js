const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const GoalFollow = goals.GoalFollow

const bot = mineflayer.createBot({
    host: 'localhost',
    port: 36573,
    username: 'pathfinder_Bot'
})

bot.loadPlugin(pathfinder)

function followPlayer() {
    const playerCI = bot.players['TheDudeFromCI']

    if (!playerCI || !playerCI.entity) {
        bot.chat("I can't see CI!")
        return
    }

    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.scafoldingBlocks = []

    bot.pathfinder.setMovements(movements)

    const goal = new GoalFollow(playerCI.entity, 1)
    bot.pathfinder.setGoal(goal, true)
}

bot.once('spawn', followPlayer)