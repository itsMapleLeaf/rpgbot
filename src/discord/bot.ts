import {
  BitFieldResolvable,
  Client,
  CommandInteraction,
  GuildMember,
  IntentsString,
  SelectMenuInteraction,
  Snowflake,
} from "discord.js"
import { logger } from "../logger"
import { bindClientEvents } from "./client-events"
import { CommandHandler } from "./command-handler"
import { CommandHandlerAction } from "./command-handler-action"
import { createReplyOptions } from "./reply-component"

const pendingSelectResponses = new Set<{
  customId: string
  callback: (values: string[]) => void
  iterator: AsyncIterableIterator<CommandHandlerAction>
}>()

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
  iterator: AsyncIterableIterator<CommandHandlerAction>,
  interaction: CommandInteraction | SelectMenuInteraction,
) {
  while (true) {
    const result = await iterator.next()
    if (result.done) break

    const action = result.value

    if (action.type === "add") {
      const options = createReplyOptions(action.components)
      if (interaction.replied) {
        await interaction.followUp(options)
      } else {
        await interaction.reply(options)
      }
      continue
    }

    if (action.type === "update") {
      const options = createReplyOptions(action.components)
      if (interaction.isSelectMenu()) {
        await interaction.update(options)
      } else {
        await interaction.reply(options)
      }
      continue
    }

    if (action.type === "selectResponse") {
      pendingSelectResponses.add({
        iterator,
        ...action,
      })
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

        const iterator = handler.run({ member: interaction.member as GuildMember })
        resumeCommandIterator(iterator, interaction)
      }

      if (interaction.isSelectMenu()) {
        const pending = [...pendingSelectResponses].find(
          ({ customId }) => customId === interaction.customId,
        )

        if (pending) {
          pending.callback(interaction.values)
          resumeCommandIterator(pending.iterator, interaction)
          pendingSelectResponses.delete(pending)
        }
      }
    },
  })

  await bot.login(token)
}
