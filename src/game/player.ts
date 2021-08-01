import { Snowflake } from "discord.js"
import { Player } from "../../prisma/client"
import { db } from "../db"
import { getInitialLocationId } from "./locations"

export async function ensurePlayer(discordUserId: Snowflake): Promise<Player> {
  return (
    (await db.player.findUnique({
      where: { discordUserId },
    })) ??
    (await db.player.create({
      data: {
        discordUserId,
        locationId: getInitialLocationId(),
      },
    }))
  )
}
