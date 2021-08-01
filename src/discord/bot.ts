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
import { CommandHandler, CommandHandlerIterator } from "./command-handler"
import { createReplyOptions } from "./reply-component"

const pendingResponses = new Set<{
  customId: string
  callback: (values: string[]) => void
  iterator: CommandHandlerIterator
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
  iterator: CommandHandlerIterator,
  interaction: CommandInteraction | MessageComponentInteraction,
) {
  let running = true
  while (running) {
    const result = await iterator.next()
    if (result.done) break

    const actions = [result.value].flat()
    for (const action of actions) {
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
        if (interaction.isMessageComponent()) {
          await interaction.update(options)
        } else {
          await interaction.reply(options)
        }
        continue
      }

      if (action.type === "selectResponse" || action.type === "buttonResponse") {
        pendingResponses.add({ iterator, ...action })
        running = false
        continue
      }
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
        await resumeCommandIterator(iterator, interaction)
      }

      if (interaction.isMessageComponent()) {
        const responses = [...pendingResponses]
        pendingResponses.clear()

        for (const pending of responses) {
          if (pending.customId === interaction.customId) {
            pending.callback(interaction.isSelectMenu() ? interaction.values : [])
            await resumeCommandIterator(pending.iterator, interaction)
          }
        }
      }
    },
  })

  await bot.login(token)
}
