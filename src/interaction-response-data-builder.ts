import { InteractionApplicationCommandCallbackData } from "https://deno.land/x/discordeno@12.0.1/mod.ts"
import { EmbedBuilder, createEmbedBuilder } from "./embed-builder.ts"

export type InteractionResponseDataBuilder = ReturnType<typeof createInteractionResponseDataBuilder>

export function createInteractionResponseDataBuilder(
  data: InteractionApplicationCommandCallbackData = {},
) {
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
