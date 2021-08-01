import { Intents } from "discord.js"
import "dotenv/config.js"
import { getErrorInfo, raise } from "./common/helpers"
import { runBot } from "./discord/bot"
import { commands } from "./game/commands"
import { logger } from "./logger"

runBot({
  token: process.env.BOT_TOKEN ?? raise("BOT_TOKEN environment variable set"),
  intents: [Intents.FLAGS.GUILDS],
  commands,
}).catch((error: unknown) => {
  logger.error(`Error in main`)
  logger.error(getErrorInfo(error))
})
