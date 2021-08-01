import { Guild, GuildMember } from "discord.js"
import "dotenv/config.js"
import { runBot } from "./bot"
import { createCommandManager } from "./command-manager"
import { addCommands } from "./commands"
import { getErrorInfo, toError } from "./common"
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
        const replyGenerator = commandManager.getInteractionReplies(interaction, {
          member: interaction.member as GuildMember,
        })
        if (!replyGenerator) {
          logger.warn(`No reply for ${interaction.command?.name}`)
          return interaction.reply(
            "Huh, don't know what to do with that one. Something went wrong. Wait a few and try again.",
          )
        }

        const firstReply = await replyGenerator.next()
        await interaction.reply(firstReply.value)

        for await (const reply of replyGenerator) {
          await interaction.followUp(reply)
        }
      } catch (error) {
        await interaction.reply("Oops, something went wrong. lol")
        logger.error(toError(error).stack || toError(error).message)
      }
    },
  })

  async function handleGuildAvailable(guild: Guild) {
    logger.info(`Guild ${guild.id} available`)
    await commandManager.syncSlashCommands(client.application!.commands, guild.id)
  }
}

main().catch((error: unknown) => {
  logger.error(`Error in main`)
  logger.error(getErrorInfo(error))
})
