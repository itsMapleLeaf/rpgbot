import {
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageEmbedOptions,
  MessageSelectMenuOptions,
  MessageSelectOptionData,
} from "discord.js"
import { isTruthy } from "../common/helpers"
import { Falsy } from "../common/types"

export type ReplyComponent =
  | { type: "content"; content: string }
  | { type: "embed"; embed: MessageEmbedOptions }
  | { type: "actionRow"; children: ActionRowChild[] }

export type ActionRowChild = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
}

export function embedComponent(embed: MessageEmbedOptions): ReplyComponent {
  return { type: "embed", embed }
}

export function actionRowComponent(...children: ActionRowChild[]): ReplyComponent {
  return {
    type: "actionRow",
    children,
  }
}

export function selectMenuComponent(options: {
  customId: string
  options: MessageSelectOptionData[]
}): ActionRowChild {
  return {
    type: "selectMenu",
    ...options,
  }
}

export function createReplyOptions(components: ReplyComponent[]): InteractionReplyOptions {
  const content = components
    .map((c) => c.type === "content" && c.content)
    .filter(isTruthy)
    .join("\n")

  const embeds = components
    .map((component) => component.type === "embed" && component.embed)
    .filter(isTruthy)

  const replyComponents: MessageActionRowOptions[] = components
    .map<MessageActionRowOptions | Falsy>((component) => {
      if (component.type !== "actionRow") return
      return {
        type: "ACTION_ROW",
        components: component.children
          .map<MessageSelectMenuOptions | Falsy>((c) => {
            if (c.type !== "selectMenu") return
            return {
              type: "SELECT_MENU",
              customId: c.customId,
              options: c.options,
            }
          })
          .filter(isTruthy),
      }
    })
    .filter(isTruthy)

  return { content, embeds, components: replyComponents }
}
