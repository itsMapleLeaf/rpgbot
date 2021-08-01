import {
  MessageActionRowComponentOptions,
  MessageActionRowOptions,
  MessageSelectMenuOptions,
} from "discord.js"

export function actionRow(components: MessageActionRowComponentOptions[]): MessageActionRowOptions {
  return {
    type: "ACTION_ROW",
    components,
  }
}

export function selectMenu(
  customId: string,
  options: { label: string; value: string }[],
): MessageSelectMenuOptions {
  return {
    type: "SELECT_MENU",
    customId,
    options,
  }
}
