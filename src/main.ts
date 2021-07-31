import * as discorddeno from "https://deno.land/x/discordeno@12.0.1/mod.ts"
import { env } from "./env.ts"
import "./commands.ts"
import {
  createSlashCommands,
  getCommandInteractionResponseData,
} from "./command-handler.ts"

await discorddeno.startBot({
  token: env.require("BOT_TOKEN"),
  intents: ["Guilds"],
  eventHandlers: {
    ready() {
      console.info("Ready")
    },

    async guildAvailable(guild) {
      console.info(`Joined guild "${guild.name}"`)
      await createSlashCommands(guild.id)
    },

    async interactionCreate(interaction) {
      if (
        interaction.type === discorddeno.InteractionTypes.ApplicationCommand
      ) {
        const commandNotFoundResponse: discorddeno.InteractionApplicationCommandCallbackData =
          {
            content: `Oops, something went wrong. Couldn't find a command to run for that one! Try again.`,
          }

        const response = await getCommandInteractionResponseData(interaction)

        discorddeno.sendInteractionResponse(interaction.id, interaction.token, {
          type: discorddeno.InteractionResponseTypes.ChannelMessageWithSource,
          data: response ?? commandNotFoundResponse,
        })
      }
    },
  },
})
