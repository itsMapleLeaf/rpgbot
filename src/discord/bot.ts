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
import { CommandHandler, CommandHandlerIterator, ComponentInteraction } from "./command-handler"
import { createReplyOptions } from "./reply-component"

const pendingInteractions = new Set<{ iterator: CommandHandlerIterator }>()

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

async function resumeCommandIterator(
  iterator: CommandHandlerIterator,
  interaction: CommandInteraction | MessageComponentInteraction,
) {
  while (true) {
    const interactionInfo: ComponentInteraction | undefined = interaction.isSelectMenu()
      ? { type: "select", customId: interaction.customId, values: interaction.values }
      : interaction.isButton()
      ? { type: "button", customId: interaction.customId }
      : undefined

    const result = await iterator.next(interactionInfo)
    if (result.done) break

    const action = result.value

    if (action.type === "add") {
      const options = createReplyOptions(action.components)
      if (interaction.deferred) {
        await interaction.editReply(options)
        continue
      }

      if (interaction.replied) {
        await interaction.followUp(options)
        continue
      }

      await interaction.reply(options)
      continue
    }

    if (action.type === "update") {
      const options = createReplyOptions(action.components)

      if (interaction.deferred) {
        await interaction.editReply(options)
        continue
      }

      if (interaction.isMessageComponent()) {
        await interaction.update(options)
        continue
      }

      if (interaction.replied) {
        await interaction.editReply(options)
        continue
      }

      await interaction.followUp(options)
      continue
    }

    if (action.type === "interaction") {
      pendingInteractions.add({ iterator })
      break
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

        await resumeCommandIterator(
          handler.run({ member: interaction.member as GuildMember }),
          interaction,
        )
        return
      }

      if (interaction.isMessageComponent()) {
        const interactions = [...pendingInteractions]
        pendingInteractions.clear()

        for (const pending of interactions) {
          await resumeCommandIterator(pending.iterator, interaction)
        }
        return
      }
    },
  })

  await bot.login(token)
}
