import * as discorddeno from "https://deno.land/x/discordeno@12.0.1/mod.ts"
import { MaybePromise } from "./types.ts"

type Command = {
  config: CommandConfig
  appCommand?: discorddeno.ApplicationCommand
}

type CommandConfig = {
  name: string
  description: string
  run: () => MaybePromise<discorddeno.InteractionApplicationCommandCallbackData>
}

const commands: Command[] = []

export function addCommand(config: CommandConfig) {
  commands.push({ config })
}

export async function createSlashCommands(guildId: bigint) {
  for (const command of commands) {
    console.info(`Registering command "${command.config.name}"`)

    const { name, description } = command.config
    command.appCommand = await discorddeno.createSlashCommand(
      { name, description },
      guildId
    )
  }
}

export async function getCommandInteractionResponseData(
  data: discorddeno.SlashCommandInteraction
) {
  const command = commands.find((command) => command.appCommand?.id === data.id)
  return await command?.config.run()
}
