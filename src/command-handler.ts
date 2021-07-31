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

export function addCommand(config: CommandConfig) {
  commands.push({ config })
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

export async function getCommandInteractionResponseData(
  interaction: discorddeno.SlashCommandInteraction,
  context: CommandContext,
) {
  const command = commands.find((command) => command.appCommand?.id === interaction.data?.id)
  return await command?.config.run(context)
}
