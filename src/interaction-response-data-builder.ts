import { InteractionReplyOptions } from "discord.js"
import { createEmbedBuilder, EmbedBuilder } from "./embed-builder"

export type InteractionResponseDataBuilder = ReturnType<typeof createInteractionResponseDataBuilder>

export function createInteractionResponseDataBuilder(data: InteractionReplyOptions = {}) {
  return {
    setContent(content: string) {
      return createInteractionResponseDataBuilder({ ...data, content })
    },
    addEmbed(buildEmbed: (builder: EmbedBuilder) => EmbedBuilder) {
      return createInteractionResponseDataBuilder({
        ...data,
        embeds: [...(data.embeds ?? []), buildEmbed(createEmbedBuilder()).build()],
      })
    },
    build() {
      return data
    },
  }
}
