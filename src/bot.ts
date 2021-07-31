import { Client, ClientEvents, Intents } from "discord.js"
import { toError } from "./common"
import { logger } from "./logger"

type ClientEventMap = {
  [EventName in keyof ClientEvents]?: (
    ...args: ClientEvents[EventName]
  ) => void | Promise<unknown>
}

export async function runBot(events: ClientEventMap) {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  })

  for (const [eventName, callback] of Object.entries(events)) {
    client.on(eventName, async (...args) => {
      try {
        await callback(...(args as never[]))
      } catch (error) {
        const { message, stack } = toError(error)
        logger.error(
          `An error occurred running ${eventName} ${stack || message}`,
        )
      }
    })
  }

  await client.login(process.env.BOT_TOKEN)

  return client
}
