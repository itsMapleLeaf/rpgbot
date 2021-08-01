import {
  MessageEmbed,
  MessageEmbedAuthor,
  MessageEmbedFooter,
  MessageEmbedImage,
  MessageEmbedOptions,
  MessageEmbedThumbnail,
} from "discord.js"

export type EmbedBuilder = ReturnType<typeof createEmbedBuilder>

export function createEmbedBuilder(embedOptions: MessageEmbedOptions = {}) {
  return {
    setTitle(title: string) {
      return createEmbedBuilder({ ...embedOptions, title })
    },
    setDescription(description: string) {
      return createEmbedBuilder({ ...embedOptions, description })
    },
    setAuthor(author: MessageEmbedAuthor) {
      return createEmbedBuilder({ ...embedOptions, author })
    },
    setAuthorName(name: string) {
      return createEmbedBuilder({ ...embedOptions, author: { ...embedOptions.author, name } })
    },
    setAuthorIcon(url: string | undefined | null) {
      return createEmbedBuilder({
        ...embedOptions,
        author: { ...embedOptions.author, iconURL: url ?? undefined },
      })
    },
    setColor(color: number) {
      return createEmbedBuilder({ ...embedOptions, color })
    },
    setImage(image: MessageEmbedImage) {
      return createEmbedBuilder({ ...embedOptions, image })
    },
    setThumbnail(thumbnail: MessageEmbedThumbnail) {
      return createEmbedBuilder({ ...embedOptions, thumbnail })
    },
    setFooter(footer: MessageEmbedFooter) {
      return createEmbedBuilder({ ...embedOptions, footer })
    },
    setTimestamp(timestamp: number | Date | undefined) {
      return createEmbedBuilder({ ...embedOptions, timestamp })
    },
    addField(name: string, value: string) {
      return createEmbedBuilder({
        ...embedOptions,
        fields: [...(embedOptions.fields ?? []), { name, value }],
      })
    },
    addInlineField(name: string, value: string) {
      return createEmbedBuilder({
        ...embedOptions,
        fields: [...(embedOptions.fields ?? []), { name, value, inline: true }],
      })
    },
    build() {
      return new MessageEmbed(embedOptions)
    },
  }
}
