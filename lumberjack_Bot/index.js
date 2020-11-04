const mineflayer = require('mineflayer')
const collectBlockPlugin = require('mineflayer-collectblock').plugin
const { Vec3 } = require('vec3')

const bot = mineflayer.createBot({
  host: process.argv[2],
  port: process.argv[3],
  username: process.argv[4] || 'lumberjack_Bot',
  password: process.argv[5]
})

bot.loadPlugin(collectBlockPlugin);

// Tree farm bounds
const FARM_POINT_1 = new Vec3(265, 76, 283)
const FARM_POINT_2 = new Vec3(239, 84, 305)
const FARM_MIN = FARM_POINT_1.min(FARM_POINT_2)
const FARM_MAX = FARM_POINT_1.max(FARM_POINT_2)

// Load deposit chests
bot.once('spawn', () => {
  bot.collectBlock.chestLocations.push(new Vec3(244, 75, 274))
  bot.collectBlock.chestLocations.push(new Vec3(242, 75, 274))
  bot.collectBlock.chestLocations.push(new Vec3(242, 75, 271))
  bot.collectBlock.chestLocations.push(new Vec3(243, 75, 271))
  bot.collectBlock.chestLocations.push(new Vec3(244, 77, 274))
  bot.collectBlock.chestLocations.push(new Vec3(242, 77, 274))
  bot.collectBlock.chestLocations.push(new Vec3(242, 77, 271))
  bot.collectBlock.chestLocations.push(new Vec3(243, 77, 271))
})

// Load axe retrieval chests
bot.once('spawn', () => {
  bot.tool.chestLocations.push(new Vec3(254, 76, 282))
})

// Load Minecraft Data
let mcData
bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version)
})

// Load log types
let logTypes
bot.once('spawn', () => {
  logTypes = buildIDList([
    // Before 1.13 logs were called "wood"
    'oak_wood', 'birch_wood', 'jungle_wood', 'spruce_wood', 'acacia_wood', 'dark_oak_wood',

    // 1.13 and later, logs are called logs
    'oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log',

    // In 1.16 and later, we have nether trees, too!
    'crimson_stem', 'warped_stem'
  ])
})

// Load dirt types
let dirtTypes
bot.once('spawn', () => {
  dirtTypes = buildIDList([
    // After 1.13, "grass" was renamed to "grass_block", so we need to check for both
    'dirt', 'podzol', 'grass', 'grass_block'
  ])
})

// Create a list of block IDs from a list of block names
function buildIDList(names) {
  const types = []
  for (const name of names) {
    const type = mcData.blocksByName[name]
    if (type) logTypes.push(type.id)
  }

  return types
}

// Checks if the block is a log
function isLog (block) {
  return logTypes.includes(block.type)
}

// Checks if the block is dirt or grass
function isDirt (block) {
  return dirtTypes.includes(block.type)
}

// Create listeners for tree locations and collect existing trees
bot.once('spawn', () => {

  // Iterate over all blocks along the bottom of the farm
  for (let x = FARM_MIN.x; x <= FARM_MAX.x; x++) {
    for (let z = FARM_MIN.z; z <= FARM_MIN.z; z++) {
      let pos = new Vec3(x, FARM_MIN.y, z)

      // Only look for dirt blocks, since that's what our trees grow on
      const block = bot.blockAt(pos)
      if (!isDirt(block)) continue

      // If we found a tree spot, create an event listener for the block above
      pos = pos.offset(0, 1, 0)
      bot.on(`blockUpdate:${pos}`, (oldBlock, newBlock) => collectTree(newBlock))

      // Try and collect the tree if there is one
      collectTree(block)
    }
  }
})

let replantLocations = []

// Get all logs in the tree and collect them
function collectTree (root) {
  if (!isLog(root)) return
  const logs = bot.collectBlock.findFromVein(newBlock)
  bot.collectBlock.collect(logs, { append: true}, logError)

  // Make note that the location needs to be replanted when finished
  replaceLocations.push(block.position)
}

// Log any errors we receive to the console, and declare it in chat.
function logError (err) {
  if (err) {
    bot.chat('An error has occurred.')
    console.log(err)
  }
}

// Collect any item that drops in the tree farm
bot.on('itemDrop', (entity) => {
  if (isInBounds(entity.position)) {
    bot.collectBlock.collect(logs, { append: true}, logError)
  }
})

// Checks if the given position is within the tree farm or not.
function isInBounds(pos) {
  return pos.x >= FARM_MIN.x && pos.y >= FARM_MIN.y && pos.z >= FARM_MIN.z &&
         pos.x <= FARM_MAX.x && pos.y <= FARM_MAX.y && pos.z <= FARM_MAX.z
}

// Replant any saplings we have
bot.on('collectBlock_finished', () => {
  replantSaplings()
})

// Replant as many saplings as we can
function replantSaplings (cb) {
  // Check if we have any locations left that are missing saplings
  if (replantLocations.length === 0) {
    cb()
    return
  }

  // Find a sapling in the bot's inventory
  const sapling = bot.inventory.items().find(item => item.name.includes('sapling'))
  if (!sapling) {
    cb() // Return early if we don't have any more
    return
  }

  // Move to the next sapling location and replant it
  const location = replantLocations.pop()
  bot.pathfinder.goto(location, (err) => {

    // If we are interrupted because the goal changed because of
    // collectBlock, we can do nothing and try to finish sometime later.
    if (err.name === 'GoalChanged') return

    bot.equip(sapling, 'hand', () => {
      const referenceBlock = bot.blockAt(location.offset(0, -1, 0))
      bot.placeBlock(referenceBlock, new Vec3(0, 1, 0), () => replantSaplings(cb))
    })
  })
}