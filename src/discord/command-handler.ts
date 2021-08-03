import { GuildMember } from "discord.js"
import { CommandHandlerAction } from "./command-handler-action"

export type CommandHandlerIterator = AsyncGenerator<
  CommandHandlerAction,
  void,
  ComponentInteraction | undefined
>

export type ComponentInteraction =
  | { type: "button"; customId: string; values?: undefined }
  | { type: "select"; customId: string; values: string[] }

export type CommandHandler = {
  name: string
  description: string
  run: (context: { member: GuildMember }) => CommandHandlerIterator
}
