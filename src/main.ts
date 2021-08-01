import {
  Client,
  CommandInteraction,
  GuildMember,
  Intents,
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageEmbedOptions,
  MessageSelectMenuOptions,
  MessageSelectOptionData,
  SelectMenuInteraction,
  Snowflake,
} from "discord.js"
import "dotenv/config.js"
import { bindClientEvents } from "./client-events"
import { getErrorInfo, isTruthy } from "./common"
import { db } from "./db"
import { buildEmbed } from "./embed-builder"
import { getInitialLocation, getInitialLocationId, getLocation, Location } from "./locations"
import { logger } from "./logger"
import { ensurePlayer } from "./player"
import { Falsy } from "./types"

type CommandHandler = {
  name: string
  description: string
  run: (context: { member: GuildMember }) => AsyncIterableIterator<CommandHandlerAction>
}

type CommandHandlerAction =
  | { type: "add"; components: InteractionComponent[] }
  | { type: "update"; components: InteractionComponent[] }
  | { type: "selectResponse"; customId: string; callback: (values: string[]) => void }

type InteractionComponent =
  | { type: "content"; content: string }
  | { type: "embed"; embed: MessageEmbedOptions }
  | { type: "actionRow"; children: ActionRowChild[] }

type ActionRowChild = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
}

function addReply(...components: (string | InteractionComponent)[]): CommandHandlerAction {
  return {
    type: "add",
    components: components.map((c) =>
      typeof c === "string" ? { type: "content", content: c } : c,
    ),
  }
}

function updateReply(...components: (string | InteractionComponent)[]): CommandHandlerAction {
  return {
    type: "update",
    components: components.map((c) =>
      typeof c === "string" ? { type: "content", content: c } : c,
    ),
  }
}

function selectResponse(
  customId: string,
  callback: (values: string[]) => void,
): CommandHandlerAction {
  return { type: "selectResponse", customId, callback }
}

function embedComponent(embed: MessageEmbedOptions): InteractionComponent {
  return { type: "embed", embed }
}

function actionRow(...children: ActionRowChild[]): InteractionComponent {
  return {
    type: "actionRow",
    children,
  }
}

function selectMenu(options: {
  customId: string
  options: MessageSelectOptionData[]
}): ActionRowChild {
  return {
    type: "selectMenu",
    ...options,
  }
}

const commandHandlers: CommandHandler[] = [
  {
    name: "status",
    description: "See where you are, what you have, etc.",
    async *run({ member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)

      if (!location) {
        player = await db.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()

        yield addReply(
          `Couldn't find where you were, so I just moved you back to ${location.name}. Anyway...`,
        )
      }

      yield addReply(
        `Here's where you're at.`,
        embedComponent(
          buildEmbed()
            .authorName(member.displayName)
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .inlineField("Location", location.name)
            .inlineField("Exits", location.exits.map((id) => getLocation(id).name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "move",
    description: "Move someplace else",
    async *run({ member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)

      if (!location) {
        player = await db.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()

        yield addReply(
          `Couldn't find where you were, so I just moved you back to ${location.name}. Anyway...`,
        )
      }

      const options = location.exits.map((id) => {
        const location = getLocation(id)
        return {
          label: location.name,
          value: id,
        }
      })

      let newLocation: Location | undefined
      const selectId = "newLocation"

      yield addReply(
        `Where do you want to go?`,
        actionRow(selectMenu({ customId: selectId, options })),
      )

      while (!newLocation) {
        yield selectResponse(selectId, ([value]) => {
          if (value) newLocation = getLocation(value)
        })

        if (!newLocation) {
          yield addReply(
            `Huh, couldn't find that location. Try again.`,
            actionRow(selectMenu({ customId: selectId, options })),
          )
        }
      }

      await db.player.update({
        where: { discordUserId: member.user.id },
        data: { locationId: newLocation.id },
      })

      yield updateReply(
        `Alright, here we are.`,
        embedComponent(
          buildEmbed()
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .authorName(`${member.displayName} moved!`)
            .title(newLocation.name)
            .description(newLocation.description)
            .field("Exits", newLocation.exits.map((id) => getLocation(id).name).join(", "))
            .finish(),
        ),
      )
    },
  },
]

const pendingSelectResponses = new Set<{
  customId: string
  callback: (values: string[]) => void
  iterator: AsyncIterableIterator<CommandHandlerAction>
}>()

const bot = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

async function syncCommands(guildId: Snowflake) {
  for (const command of commandHandlers) {
    logger.info(`Adding command: ${command.name}`)
    await bot.application?.commands.create(command, guildId)
  }

  const commandNames = new Set(commandHandlers.map((c) => c.name))
  for (const appCommand of bot.application?.commands.cache.values() ?? []) {
    if (!commandNames.has(appCommand.name)) {
      logger.info(`Removing command: ${appCommand.name}`)
      await bot.application?.commands.delete(appCommand.id)
    }
  }
}

async function main() {
  bindClientEvents(bot, {
    async ready() {
      logger.info("Ready")

      for (const [, guild] of bot.guilds.cache) {
        await syncCommands(guild.id)
      }
    },

    async guildCreate(guild) {
      await syncCommands(guild.id)
    },

    async interactionCreate(interaction) {
      if (!interaction.inGuild()) {
        return
      }

      function createReplyOptions(components: InteractionComponent[]): InteractionReplyOptions {
        const content = components
          .map((c) => c.type === "content" && c.content)
          .filter(isTruthy)
          .join("\n")

        const embeds = components
          .map((component) => component.type === "embed" && component.embed)
          .filter(isTruthy)

        const replyComponents: MessageActionRowOptions[] = components
          .map<MessageActionRowOptions | Falsy>((component) => {
            if (component.type !== "actionRow") return
            return {
              type: "ACTION_ROW",
              components: component.children
                .map<MessageSelectMenuOptions | Falsy>((c) => {
                  if (c.type !== "selectMenu") return
                  return {
                    type: "SELECT_MENU",
                    customId: c.customId,
                    options: c.options,
                  }
                })
                .filter(isTruthy),
            }
          })
          .filter(isTruthy)

        return { content, embeds, components: replyComponents }
      }

      async function runIterator(
        iterator: AsyncIterableIterator<CommandHandlerAction>,
        interaction: CommandInteraction | SelectMenuInteraction,
      ) {
        let running = true
        do {
          const result = await iterator.next()

          if (result.done) {
            running = false
            break
          }

          const action = result.value

          if (action.type === "add") {
            const options = createReplyOptions(action.components)
            if (interaction.replied) {
              await interaction.followUp(options)
            } else {
              await interaction.reply(options)
            }
            continue
          }

          if (action.type === "update") {
            const options = createReplyOptions(action.components)
            if (interaction.isSelectMenu()) {
              await interaction.update(options)
            } else {
              await interaction.reply(options)
            }
            continue
          }

          if (action.type === "selectResponse") {
            pendingSelectResponses.add({
              iterator,
              ...action,
            })
            break
          }
        } while (running)
      }

      if (interaction.isCommand()) {
        const handler = commandHandlers.find((c) => c.name === interaction.commandName)
        if (!handler) return

        const iterator = handler.run({ member: interaction.member as GuildMember })
        runIterator(iterator, interaction)
      }

      if (interaction.isSelectMenu()) {
        const pending = [...pendingSelectResponses].find(
          ({ customId }) => customId === interaction.customId,
        )

        if (pending) {
          pending.callback(interaction.values)
          runIterator(pending.iterator, interaction)
          pendingSelectResponses.delete(pending)
        }
      }
    },
  })

  await bot.login(process.env.BOT_TOKEN)
}

main().catch((error: unknown) => {
  logger.error(`Error in main`)
  logger.error(getErrorInfo(error))
})
