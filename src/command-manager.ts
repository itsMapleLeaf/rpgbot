import {
  ApplicationCommand,
  ApplicationCommandManager,
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
  MessagePayload,
  Snowflake,
} from "discord.js"
import { logger } from "./logger"

type CommandInstance = {
  config: CommandConfig
  appCommand?: ApplicationCommand
  iterator?: AsyncGenerator<CommandReply>
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

export class CommandManager {
  #commands: CommandInstance[] = []

  #findCommandByName(name: string): CommandInstance | undefined {
    return this.#commands.find((c) => c.config.name === name)
  }

  add(config: CommandConfig): CommandConfig {
    this.#commands.push({ config })
    return config
  }

  async syncSlashCommands(
    commandManager: ApplicationCommandManager,
    guildId: Snowflake,
  ): Promise<void> {
    // remove unconfigured commands
    const existingCommands = await commandManager.fetch(undefined, {
      guildId,
    })

    for (const command of this.#commands) {
      if (existingCommands.some((appCommand) => appCommand.name === command.config.name)) continue

      logger.info(`Adding command "${command.config.name}"`)
      command.appCommand = await commandManager.create(command.config, guildId)
    }

    for (const [, existingCommand] of existingCommands) {
      const configuredCommand = this.#commands.find((c) => c.config.name === existingCommand.name)
      if (configuredCommand) continue

      logger.info(`Removing command "${existingCommand.name}"`)
      await commandManager.delete(existingCommand, guildId)
    }
  }

  handleCommandInteraction(
    interaction: CommandInteraction,
    context: CommandContext,
  ): AsyncIterator<CommandReply> | undefined {
    const command = this.#findCommandByName(interaction.commandName)
    if (!command) return

    return (command.iterator ??= command.config.run(context))
  }

  handleMessageComponentInteraction(interaction: MessageComponentInteraction) {
    const command = this.#findCommandByName(
      (interaction.message as Message).interaction?.commandName!,
    )
    if (!command) return
  }
}

export function createCommandManager() {
  return new CommandManager()
}
