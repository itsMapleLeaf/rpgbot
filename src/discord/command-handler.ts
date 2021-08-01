import { GuildMember } from "discord.js"
import { CommandHandlerAction } from "./command-handler-action"

export type CommandHandler = {
  name: string
  description: string
  run: (context: { member: GuildMember }) => AsyncIterableIterator<CommandHandlerAction>
}
