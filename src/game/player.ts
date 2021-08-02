import { Snowflake } from "discord.js"
import { db } from "../db"
import { getInitialLocationId } from "./locations"

export async function ensurePlayer(discordUserId: Snowflake) {
  const include = {
    location: { include: { exitLocations: true } },
  }

  return (
    (await db.player.findUnique({
      where: { discordUserId },
      include,
    })) ??
    (await db.player.create({
      data: {
        discordUserId,
        locationId: getInitialLocationId(),
      },
      include,
    }))
  )
}
