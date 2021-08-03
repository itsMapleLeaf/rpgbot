import { GuildMember } from "discord.js"
import { ReplyComponentArgs } from "./reply-component"

export type ComponentInteraction =
  | { type: "button"; customId: string; values?: undefined }
  | { type: "select"; customId: string; values: string[] }

export type CommandHandler = {
  name: string
  description: string
  run: (context: CommandHandlerContext) => void | Promise<unknown>
}

export type CommandHandlerContext = {
  member: GuildMember
  addReply: (...components: ReplyComponentArgs) => Promise<void>
  addEphemeralReply: (...components: ReplyComponentArgs) => Promise<void>
  updateReply: (...components: ReplyComponentArgs) => Promise<void>
  deleteReply: () => Promise<void>
  waitForInteraction: () => Promise<ComponentInteraction | undefined>
}
