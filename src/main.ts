import { Guild, GuildMember } from "discord.js"
import "dotenv/config.js"
import { runBot } from "./bot"
import { createCommandManager } from "./command-handler"
import { addCommands } from "./commands"
import { toError } from "./common"
import { logger } from "./logger"

async function main() {
  const commandManager = createCommandManager()
  addCommands(commandManager)

  const client = await runBot({
    async ready() {
      logger.info("Ready")

      for (const guild of client.guilds.cache.values()) {
        await handleGuildAvailable(guild)
      }
    },

    async guildCreate(guild) {
      await handleGuildAvailable(guild)
    },

    async interactionCreate(interaction) {
      if (!interaction.isCommand()) {
        return // Ignore non-commands
      }

      if (!interaction.inGuild()) {
        return interaction.reply("Sorry, can only use this in guilds for now!")
      }

      try {
        const reply = await commandManager.getInteractionReply(interaction, {
          member: interaction.member as GuildMember,
        })
        if (!reply) {
          logger.warn(`No reply for ${interaction.command?.name}`)
          return interaction.reply(
            "Huh, don't know what to do with that one. Something went wrong. Wait a few and try again.",
          )
        }

        return interaction.reply(reply)
      } catch (error) {
        await interaction.reply("Oops, something went wrong. lol")
        logger.error(toError(error).stack || toError(error).message)
      }
    },
  })

  async function handleGuildAvailable(guild: Guild) {
    logger.info(`Guild ${guild.id} available`)
    await commandManager.syncSlashCommands(
      client.application!.commands,
      guild.id,
    )
  }
}

main().catch((error) => {
  const { stack, message } = toError(error)
  logger.error(`Failed to start: ${stack || message}`)
})
