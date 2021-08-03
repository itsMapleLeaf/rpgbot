import {
  BitFieldResolvable,
  Client,
  CommandInteraction,
  GuildMember,
  IntentsString,
  MessageComponentInteraction,
  Snowflake,
} from "discord.js"
import { logger } from "../logger"
import { bindClientEvents } from "./client-events"
import { CommandHandler, CommandHandlerContext, ComponentInteraction } from "./command-handler"
import {
  addOrCreateReply,
  editOrCreateReply,
  getComponentInteractionInfo,
} from "./interaction-helpers"
import { createReplyOptions } from "./reply-component"

const pendingInteractions = new Set<{
  resolve: (interaction: ComponentInteraction | undefined) => void
}>()

function createCommandHandlerContext(
  interaction: CommandInteraction | MessageComponentInteraction,
  member: GuildMember,
): CommandHandlerContext {
  return {
    member,

    addReply: async (...components) => {
      await addOrCreateReply(interaction, createReplyOptions(components))
    },

    addEphemeralReply: async (...components) => {
      await addOrCreateReply(interaction, {
        ...createReplyOptions(components),
        ephemeral: true,
      })
    },

    updateReply: async (...components) => {
      await editOrCreateReply(interaction, createReplyOptions(components))
    },

    deleteReply: async () => {
      if (interaction.ephemeral) {
        logger.warn("Attempted to delete ephemeral message")
        return
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.deleteReply()
      }
    },

    waitForInteraction: () => {
      return new Promise((resolve) => {
        pendingInteractions.add({ resolve })
      })
    },
  }
}

async function syncCommands(bot: Client, commands: CommandHandler[], guildId: Snowflake) {
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

export async function runBot({
  token,
  intents,
  commands,
}: {
  token: string
  intents: BitFieldResolvable<IntentsString, number>
  commands: CommandHandler[]
}) {
  const bot = new Client({
    intents,
  })

  bindClientEvents(bot, {
    async ready() {
      logger.info("Ready")

      for (const [, guild] of bot.guilds.cache) {
        await syncCommands(bot, commands, guild.id)
      }
    },

    async guildCreate(guild) {
      await syncCommands(bot, commands, guild.id)
    },

    async interactionCreate(interaction) {
      if (!interaction.inGuild()) {
        return
      }

      if (interaction.isCommand()) {
        const handler = commands.find((c) => c.name === interaction.commandName)
        if (!handler) return

        const context: CommandHandlerContext = createCommandHandlerContext(
          interaction,
          interaction.member as GuildMember,
        )

        await handler.run(context)
        return
      }

      if (interaction.isMessageComponent()) {
        const interactions = [...pendingInteractions]
        pendingInteractions.clear()

        for (const pending of interactions) {
          pending.resolve(getComponentInteractionInfo(interaction))
        }
        return
      }
    },
  })

  await bot.login(token)
}
