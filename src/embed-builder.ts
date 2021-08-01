import {
  MessageEmbed,
  MessageEmbedAuthor,
  MessageEmbedFooter,
  MessageEmbedImage,
  MessageEmbedOptions,
  MessageEmbedThumbnail,
} from "discord.js"

export type EmbedBuilder = ReturnType<typeof buildEmbed>

export function buildEmbed(embedOptions: MessageEmbedOptions = {}) {
  return {
    title(title: string) {
      return buildEmbed({ ...embedOptions, title })
    },
    description(description: string) {
      return buildEmbed({ ...embedOptions, description })
    },
    author(author: MessageEmbedAuthor) {
      return buildEmbed({ ...embedOptions, author })
    },
    authorName(name: string) {
      return buildEmbed({ ...embedOptions, author: { ...embedOptions.author, name } })
    },
    authorIcon(url: string | undefined | null) {
      return buildEmbed({
        ...embedOptions,
        author: { ...embedOptions.author, iconURL: url ?? undefined },
      })
    },
    color(color: number) {
      return buildEmbed({ ...embedOptions, color })
    },
    image(image: MessageEmbedImage) {
      return buildEmbed({ ...embedOptions, image })
    },
    thumbnail(thumbnail: MessageEmbedThumbnail) {
      return buildEmbed({ ...embedOptions, thumbnail })
    },
    footer(footer: MessageEmbedFooter) {
      return buildEmbed({ ...embedOptions, footer })
    },
    timestamp(timestamp: number | Date | undefined) {
      return buildEmbed({ ...embedOptions, timestamp })
    },
    field(name: string, value: string) {
      return buildEmbed({
        ...embedOptions,
        fields: [...(embedOptions.fields ?? []), { name, value }],
      })
    },
    inlineField(name: string, value: string) {
      return buildEmbed({
        ...embedOptions,
        fields: [...(embedOptions.fields ?? []), { name, value, inline: true }],
      })
    },
    finish() {
      return new MessageEmbed(embedOptions)
    },
  }
}
