import {
  Client,
  CommandInteraction,
  GuildMember,
  Intents,
  SelectMenuInteraction,
  Snowflake,
} from "discord.js"
import "dotenv/config.js"
import { bindClientEvents } from "./client-events"
import { getErrorInfo } from "./common"
import { db } from "./db"
import { buildEmbed } from "./embed-builder"
import { actionRow, selectMenu } from "./interaction"
import { getInitialLocation, getInitialLocationId, getLocation } from "./locations"
import { logger } from "./logger"
import { ensurePlayer } from "./player"

type CommandHandler = {
  name: string
  description: string
  run: (context: {
    interaction: CommandInteraction
    member: GuildMember
  }) => void | Promise<unknown>
}

type SelectHandler = {
  customId: string
  run: (context: {
    interaction: SelectMenuInteraction
    member: GuildMember
  }) => void | Promise<unknown>
}

const commandHandlers: CommandHandler[] = [
  {
    name: "status",
    description: "See where you are, what you have, etc.",
    async run({ interaction, member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)
      let locationUpdated = false

      if (!location) {
        player = await db.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()

        locationUpdated = true
      }

      const content = (() => {
        if (locationUpdated) {
          return `Couldn't find where you were at, so I moved you back to ${location.name}. Anyway, here's where you're at.`
        }
        return `Here's where you're at.`
      })()

      await interaction.reply({
        content,
        embeds: [
          buildEmbed()
            .authorName(member.displayName)
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .inlineField("Location", location.name)
            .inlineField("Exits", location.exits.map((id) => getLocation(id).name).join(", "))
            .finish(),
        ],
      })
    },
  },

  {
    name: "move",
    description: "Move someplace else",
    async run({ interaction, member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)
      let locationUpdated = false

      if (!location) {
        player = await db.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()

        locationUpdated = true
      }

      const content = (() => {
        if (locationUpdated) {
          return `Couldn't find where you were, so I just moved you back to ${location.name}. Anyway, where do you wanna go?`
        }
        return `Where do you wanna go?`
      })()

      const options = location.exits.map((id) => {
        const location = getLocation(id)
        return {
          label: location.name,
          value: id,
        }
      })

      await interaction.reply({
        content,
        ephemeral: true,
        components: [actionRow([selectMenu("move:newLocation", options)])],
      })
    },
  },
]

const selectHandlers: SelectHandler[] = [
  {
    customId: "move:newLocation",
    async run({ interaction, member }) {
      const newLocationId = interaction.values[0]
      if (!newLocationId) {
        logger.error("Didn't receive location for move")
        return interaction.reply({ content: `Oops, something went wrong.` })
      }

      const newLocation = getLocation(newLocationId)
      if (!newLocation) {
        logger.error(`Couldn't find location with id ${newLocationId}`)
        return interaction.reply({ content: `Oops, something went wrong.` })
      }

      await db.player.update({
        where: { discordUserId: member.user.id },
        data: { locationId: newLocationId },
      })

      await interaction.reply({
        content: `Alright, here we are.`,
        ephemeral: true,
        embeds: [
          buildEmbed()
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .authorName(`${member.displayName} moved!`)
            .title(newLocation.name)
            .description(newLocation.description)
            .field("Exits", newLocation.exits.map((id) => getLocation(id).name).join(", "))
            .finish(),
        ],
      })
    },
  },
]

const bot = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

async function syncCommands(guildId: Snowflake) {
  for (const command of commandHandlers) {
    logger.info(`Adding command: ${command.name}`)
    await bot.application?.commands.create(command, guildId)
  }

  const commandNames = new Set(commandHandlers.map((c) => c.name))
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
        const handler = commandHandlers.find((c) => c.name === interaction.commandName)
        await handler?.run({
          interaction,
          member: interaction.member as GuildMember,
        })
      }

      if (interaction.isSelectMenu()) {
        const handler = selectHandlers.find((h) => h.customId === interaction.customId)
        await handler?.run({
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
