import * as discorddeno from "https://deno.land/x/discordeno@12.0.1/mod.ts"
import { toError } from "./common.ts"
import { logger } from "./logger.ts"
import { MaybePromise } from "./types.ts"

type Command = {
  config: CommandConfig
  appCommand?: discorddeno.ApplicationCommand
}

type CommandConfig = {
  name: string
  description: string
  run: (
    context: CommandContext,
  ) => MaybePromise<discorddeno.InteractionApplicationCommandCallbackData>
}

type CommandContext = {
  member: discorddeno.InteractionGuildMember
}

const commands: Command[] = []

export function addCommand(config: CommandConfig): CommandConfig {
  commands.push({ config })
  return config
}

export async function createSlashCommands(guildId: bigint) {
  for (const command of commands) {
    logger.info(`Registering command "${command.config.name}"`)

    const { name, description } = command.config

    command.appCommand = await discorddeno
      .createSlashCommand({ name, description }, guildId)
      .catch((error: unknown) => {
        const { stack, message } = toError(error)
        logger.error(stack || message)
        return undefined
      })
  }
}

export async function deleteUnknownCommands(guildId: bigint) {
  const commandNames = new Set(commands.map(({ config }) => config.name))
  for (const [, command] of await discorddeno.getSlashCommands(guildId)) {
    if (commandNames.has(command.name)) continue

    logger.info(`Removing unknown command "${command.name}"`)
    await discorddeno.deleteSlashCommand(command.id, guildId)
  }
}

export async function getCommandInteractionResponseData(
  interaction: discorddeno.SlashCommandInteraction,
  context: CommandContext,
) {
  const command = commands.find((command) => command.appCommand?.id === interaction.data?.id)
  return await command?.config.run(context)
}
