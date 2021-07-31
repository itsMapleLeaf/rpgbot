import { addCommand } from "./command-handler.ts"
import { createInteractionResponseDataBuilder } from "./interaction-response-data-builder.ts"

addCommand({
  name: "status",
  description: "See where you are, what you have, etc.",
  run: ({ member }) =>
    createInteractionResponseDataBuilder()
      .setContent(`Here's where you're at, partner!`)
      .addEmbed((embed) =>
        embed
          .setAuthorName(member.nick || member.user.username)
          .setAuthorIcon(
            `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}`,
          )
          .addField("Location", "The Tavern")
          .addInlineField("Health", "100/100")
          .addInlineField("Strength", "4")
          .addInlineField("Dexterity", "2")
          .addInlineField("Smarts", "0")
          .addInlineField("Evasion", "6")
          .addInlineField("Wits", "9"),
      )
      .build(),
})
