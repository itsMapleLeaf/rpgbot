import {
  Embed,
  EmbedAuthor,
  EmbedFooter,
  EmbedImage,
  EmbedThumbnail,
} from "https://deno.land/x/discordeno@12.0.1/mod"

export type EmbedBuilder = ReturnType<typeof createEmbedBuilder>

export function createEmbedBuilder(embed: Embed = {}) {
  return {
    setTitle(title: string) {
      return createEmbedBuilder({ ...embed, title })
    },
    setDescription(description: string) {
      return createEmbedBuilder({ ...embed, description })
    },
    setAuthor(author: EmbedAuthor) {
      return createEmbedBuilder({ ...embed, author })
    },
    setAuthorName(name: string) {
      return createEmbedBuilder({ ...embed, author: { ...embed.author, name } })
    },
    setAuthorIcon(url: string) {
      return createEmbedBuilder({
        ...embed,
        author: { ...embed.author, iconUrl: url },
      })
    },
    setColor(color: number) {
      return createEmbedBuilder({ ...embed, color })
    },
    setImage(image: EmbedImage) {
      return createEmbedBuilder({ ...embed, image })
    },
    setThumbnail(thumbnail: EmbedThumbnail) {
      return createEmbedBuilder({ ...embed, thumbnail })
    },
    setFooter(footer: EmbedFooter) {
      return createEmbedBuilder({ ...embed, footer })
    },
    setTimestamp(timestamp: string) {
      return createEmbedBuilder({ ...embed, timestamp })
    },
    addField(name: string, value: string) {
      return createEmbedBuilder({
        ...embed,
        fields: [...(embed.fields ?? []), { name, value }],
      })
    },
    addInlineField(name: string, value: string) {
      return createEmbedBuilder({
        ...embed,
        fields: [...(embed.fields ?? []), { name, value, inline: true }],
      })
    },
    build() {
      return embed
    },
  }
}
