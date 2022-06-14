const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: '112fun.aternos.me',
  port: 53675,
  username: 'killAura_Bot'
})

bot.once('spawn', () => {
    setInterval(() => {
        const mobFilter = e => e.type === 'mob' && e.mobType === 'Zombie'
        const mob = bot.nearestEntity(mobFilter)

        if (!mob) return;

        const pos = mob.position;
        bot.lookAt(pos, true, () => {
            bot.attack(mob);
        });
    }, 1000);
});
