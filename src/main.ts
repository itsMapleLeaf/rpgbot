import { Client, CommandInteraction, GuildMember, Intents, Snowflake } from "discord.js"
import "dotenv/config.js"
import { bindClientEvents } from "./client-events"
import { getErrorInfo } from "./common"
import { client } from "./db"
import { createEmbedBuilder } from "./embed-builder"
import { getInitialLocation, getInitialLocationId, getLocation } from "./locations"
import { logger } from "./logger"
import { ensurePlayer } from "./player"

type Command = {
  name: string
  description: string
  run: (context: CommandRunContext) => Promise<void>
}
type CommandRunContext = {
  interaction: CommandInteraction
  member: GuildMember
}

const commands: Command[] = [
  {
    name: "status",
    description: "See where you are, what you have, etc.",
    async run({ interaction, member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)

      if (!location) {
        await interaction.reply({
          content:
            "Not sure where you're at... maybe that place got deleted or somethin'. I'll send you back to the tavern.",
          ephemeral: true,
        })

        player = await client.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()
      }

      await interaction.followUp({
        content: `Here's where you're at!`,
        embeds: [
          createEmbedBuilder()
            .setAuthorName(member.displayName)
            .setAuthorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .addField("Location", location.name)
            .build(),
        ],
      })
    },
  },
]

const bot = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

async function syncCommands(guildId: Snowflake) {
  for (const command of commands) {
    logger.info(`Adding command: ${command.name}`)
    await bot.application?.commands.create(command, guildId)
  }

  const commandNames = new Set(commands.map((c) => c.name))
  for (const appCommand of bot.application?.commands.cache.values() ?? []) {
    if (!commandNames.has(appCommand.name)) {
      logger.info(`Removing command: ${appCommand.name}`)
      await bot.application?.commands.delete(appCommand.id)
    }
  }
}

async function main() {
  bindClientEvents(bot, {
    async ready() {
      logger.info("Ready")

      for (const [, guild] of bot.guilds.cache) {
        await syncCommands(guild.id)
      }
    },

    async guildCreate(guild) {
      await syncCommands(guild.id)
    },

    async interactionCreate(interaction) {
      if (!interaction.inGuild()) {
        return
      }

      if (interaction.isCommand()) {
        const command = commands.find((c) => c.name === interaction.commandName)
        await command?.run({
          interaction,
          member: interaction.member as GuildMember,
        })
      }
    },
  })

  await bot.login(process.env.BOT_TOKEN)
}

main().catch((error: unknown) => {
  logger.error(`Error in main`)
  logger.error(getErrorInfo(error))
})
