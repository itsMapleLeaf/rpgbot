import { addCommand } from "./command-handler.ts"

addCommand({
  name: "status",
  description: "See where you are, what you have, etc.",
  run: ({ member }) => ({
    embeds: [
      {
        author: {
          name: member.nick || member.user.username,
          iconUrl: member.user.avatar
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}`
            : undefined,
        },
        fields: [
          { name: "Location", value: "The Tavern" },
          { name: "Health", value: "100/100", inline: true },
          { name: "Strength", value: "4", inline: true },
          { name: "Dexterity", value: "2", inline: true },
          { name: "Smarts", value: "0", inline: true },
          { name: "Evasion", value: "6", inline: true },
          { name: "Wits", value: "9", inline: true },
        ],
      },
    ],
  }),
})
