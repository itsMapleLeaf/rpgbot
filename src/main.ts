import * as discorddeno from "https://deno.land/x/discordeno@12.0.1/mod.ts"
import { env } from "./env.ts"
import "./commands.ts"
import {
  createSlashCommands,
  deleteUnknownCommands,
  getCommandInteractionResponseData,
} from "./command-handler.ts"
import { logger } from "./logger.ts"

await discorddeno.startBot({
  token: env.require("BOT_TOKEN"),
  intents: ["Guilds"],
  eventHandlers: {
    ready() {
      logger.info("Ready")
    },

    async guildAvailable(guild) {
      logger.info(`Joined guild "${guild.name}"`)
      await createSlashCommands(guild.id)
      await deleteUnknownCommands(guild.id)
    },

    async interactionCreate(interaction) {
      const reply = (args: string | discorddeno.InteractionApplicationCommandCallbackData) => {
        discorddeno.sendInteractionResponse(interaction.id, interaction.token, {
          type: discorddeno.InteractionResponseTypes.ChannelMessageWithSource,
          data: typeof args === "string" ? { content: args } : args,
        })
      }

      if (!interaction.member) {
        reply("Sorry, can't run this in DMs! (yet?)")
        return
      }

      if (interaction.type !== discorddeno.InteractionTypes.ApplicationCommand) {
        // handle other interaction types later
        return
      }

      const response = await getCommandInteractionResponseData(interaction, {
        member: interaction.member,
      })
      if (!response) {
        logger.error(`No response for interaction`)
        logger.error(JSON.stringify(interaction, null, 2))
        reply(
          "Looks like this command wasn't registered yet. " +
            "Or somethin' went reeeally wrong. " +
            "Wait a few and try again.",
        )
        return
      }

      reply(response)
    },
  },
})
