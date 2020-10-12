const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalNear = goals.GoalNear;
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 42577,
  username: 'lumberjack_Bot'
})

bot.loadPlugin(pathfinder);

const FARM_POINT_1 = new Vec3(372, 4, 153)
const FARM_POINT_2 = new Vec3(394, 14, 191)
const DEPOSIT_CHEST = new Vec3(362, 5, 146)
const LOG_TYPES = []

bot.once('spawn', () => {
  loadLogTypes()
  gatherWood()
})

function loadLogTypes () {
  const mcData = require('minecraft-data')
  LOG_TYPES.push(mcData.blocksByName.oak_log.id)
  LOG_TYPES.push(mcData.blocksByName.spruce_log.id)
  LOG_TYPES.push(mcData.blocksByName.birch_log.id)
}

function gatherWood () {
  const block = findWood(block)
  if (!block) {
    setTimeout(gatherWood, 5000)
    return
  }

  chopTree(block, () => {

  })
}

function findWood () {
  for (let x = FARM_POINT_1.x; x <= FARM_POINT_2.x; x++) {
    for (let z = FARM_POINT_1.z; z <= FARM_POINT_2.z; z++) {
      for (let y = FARM_POINT_1.y; y <= FARM_POINT_2.y; y++) {
        const block = bot.blockAt(new Vec3(x, y, z))
        if (!block) continue

        if (LOG_TYPES.indexOf(block.type) > -1)
          return block
      }
    }
  }
}

function chopTree (block, cb) {
  breakBlock(block, cb)
}

function breakBlock (block, cb) {
  equipTool(block, () => {
    bot.dig(block, cb)
  })
}

function equipTool (block, cb) {
  const tool = bot.pathfinder.bestHarvestTool(block)
  if (!tool) {
    cb()
    return
  }

  bot.equip(tool, 'hand', cb)
}