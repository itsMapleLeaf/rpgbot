import {
  CommandInteraction,
  Interaction,
  InteractionReplyOptions,
  MessageComponentInteraction,
} from "discord.js"
import { ComponentInteraction } from "./command-handler"

export function editOrCreateReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  reply: InteractionReplyOptions,
) {
  if (interaction.deferred) return interaction.editReply(reply)
  if (interaction.isMessageComponent()) return interaction.update(reply)
  if (interaction.replied) return interaction.editReply(reply)
  return interaction.followUp(reply)
}

export function addOrCreateReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  reply: InteractionReplyOptions,
) {
  if (interaction.deferred) return interaction.editReply(reply)
  if (interaction.replied) return interaction.followUp(reply)
  return interaction.reply(reply)
}

export function getComponentInteractionInfo(
  interaction: Interaction,
): ComponentInteraction | undefined {
  if (interaction.isSelectMenu()) {
    return { type: "select", customId: interaction.customId, values: interaction.values }
  }
  if (interaction.isButton()) {
    return { type: "button", customId: interaction.customId }
  }
}
