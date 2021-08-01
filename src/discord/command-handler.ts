import { GuildMember } from "discord.js"
import { MaybeArray } from "../common/types"
import { CommandHandlerAction } from "./command-handler-action"

export type CommandHandlerIterator = AsyncIterableIterator<MaybeArray<CommandHandlerAction>>

export type CommandHandler = {
  name: string
  description: string
  run: (context: { member: GuildMember }) => CommandHandlerIterator
}
