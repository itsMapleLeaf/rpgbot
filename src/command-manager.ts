import {
  ApplicationCommand,
  ApplicationCommandManager,
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  MessagePayload,
  Snowflake,
} from "discord.js"
import { logger } from "./logger"

type Command = {
  config: CommandConfig
  appCommand?: ApplicationCommand
}

export type CommandReply = string | MessagePayload | InteractionReplyOptions

type CommandContext = {
  member: GuildMember
}

type CommandConfig = {
  name: string
  description: string
  run: (context: CommandContext) => AsyncGenerator<CommandReply>
}

export type CommandManager = ReturnType<typeof createCommandManager>

export function createCommandManager() {
  const commands: Command[] = []

  return {
    add(config: CommandConfig): CommandConfig {
      commands.push({ config })
      return config
    },

    async syncSlashCommands(
      commandManager: ApplicationCommandManager,
      guildId: Snowflake,
    ): Promise<void> {
      // remove unconfigured commands
      const existingCommands = await commandManager.fetch(undefined, {
        guildId,
      })

      for (const command of commands) {
        if (existingCommands.some((appCommand) => appCommand.name === command.config.name)) continue

        logger.info(`Adding command "${command.config.name}"`)
        command.appCommand = await commandManager.create(command.config, guildId)
      }

      for (const [, existingCommand] of existingCommands) {
        const configuredCommand = commands.find((c) => c.config.name === existingCommand.name)
        if (configuredCommand) continue

        logger.info(`Removing command "${existingCommand.name}"`)
        await commandManager.delete(existingCommand, guildId)
      }
    },

    async *getInteractionReplies(
      interaction: CommandInteraction,
      context: CommandContext,
    ): AsyncGenerator<CommandReply> | undefined {
      const command = commands.find((c) => c.config.name === interaction.command?.name)
      if (!command) return undefined

      for await (const reply of command.config.run(context)) {
        yield reply
      }
    },
  }
}
