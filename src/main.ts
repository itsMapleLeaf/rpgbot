import { Intents } from "discord.js"
import "dotenv/config.js"
import { getErrorInfo, raise } from "./common/helpers"
import { runBot } from "./discord/bot"
import { commands } from "./game/commands"
import { createLocations } from "./game/locations"
import { logger } from "./logger"

async function main() {
  await createLocations()

  logger.info("Running bot")
  await runBot({
    token: process.env.BOT_TOKEN ?? raise("BOT_TOKEN environment variable not set"),
    intents: [Intents.FLAGS.GUILDS],
    commands,
  })
}

main().catch((error: unknown) => {
  logger.error(`Error in main`)
  logger.error(getErrorInfo(error))
})
