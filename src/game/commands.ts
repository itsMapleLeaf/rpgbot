import { MessageSelectOptionData } from "discord.js"
import { Location } from "../../prisma/client"
import { sleep } from "../common/helpers"
import { db } from "../db"
import { CommandHandler } from "../discord/command-handler"
import {
  addReply,
  deleteReply,
  updateReply,
  waitForInteraction,
} from "../discord/command-handler-action"
import { buildEmbed } from "../discord/embed-builder"
import {
  actionRowComponent,
  buttonComponent,
  embedComponent,
  selectMenuComponent,
} from "../discord/reply-component"
import { getLocation } from "./locations"
import { ensurePlayer } from "./player"

export const commands: CommandHandler[] = [
  {
    name: "status",
    description: "See where you are, what you have, etc.",
    async *run({ member }) {
      const player = await ensurePlayer(member.user.id)

      yield addReply(
        `Here's where you're at.`,
        embedComponent(
          buildEmbed()
            .authorName(member.displayName)
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .inlineField("Location", player.location.name)
            .inlineField("Exits", player.location.exitLocations.map((l) => l.name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "move",
    description: "Move someplace else",
    async *run({ member }) {
      const player = await ensurePlayer(member.user.id)

      const options = player.location.exitLocations
        .map<MessageSelectOptionData>((location) => ({
          label: location.name,
          value: location.id,
        }))
        .concat([{ label: "invalid location for test", value: "nope lol" }])

      function locationSelectComponent() {
        return [
          actionRowComponent(selectMenuComponent({ customId: "newLocation", options })),
          actionRowComponent(
            buttonComponent({ customId: "cancel", label: "Cancel", style: "SECONDARY" }),
          ),
        ]
      }

      yield addReply(`Where do you want to go?`, ...locationSelectComponent())

      let newLocation: (Location & { exitLocations: Location[] }) | undefined
      while (!newLocation) {
        const interaction = yield waitForInteraction()

        if (interaction?.customId === "cancel") {
          yield updateReply(`Alright, carry on.`)
          await sleep(1500)
          yield deleteReply()
          return
        }

        if (interaction?.customId === "newLocation") {
          const [newLocationId] = interaction?.values ?? []
          if (newLocationId) {
            newLocation = await getLocation(newLocationId)
          }
        }

        if (!newLocation) {
          yield updateReply(
            `Huh, couldn't find that location. Try again.`,
            ...locationSelectComponent(),
          )
        }
      }

      await db.player.update({
        where: { discordUserId: member.user.id },
        data: { locationId: newLocation.id },
      })

      yield updateReply(
        `Here we are!`,
        embedComponent(
          buildEmbed()
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .authorName(`${member.displayName} moved!`)
            .title(newLocation.name)
            .description(newLocation.description)
            .field("Exits", newLocation.exitLocations.map((l) => l.name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "help",
    description: "Not sure what to do? This lists all of the commands.",
    async *run({ member }) {
      const embed = commands
        .reduce((embed, command) => embed.field(command.name, command.description), buildEmbed())
        .footer({
          text: "There ain't much yet! Still working on stuff.",
        })
        .finish()

      yield addReply(`Here's a list of commands you can use.`, embedComponent(embed))
    },
  },
]
