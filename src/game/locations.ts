import { Location } from "../../prisma/client"
import { getErrorInfo, raise } from "../common/helpers"
import { db } from "../db"
import { logger } from "../logger"

const locations = [
  {
    data: {
      id: "tavern",
      name: "The Tavern",
      description:
        "The tavern is a large building with a bar and some tables. There are several people here, including a local barwoman and several customers.",
    },
    exits: ["townSquare"],
  },
  {
    data: {
      id: "townSquare",
      name: "Town Square",
      description:
        "The town square is a large open space with a few buildings and shop stalls, paths lined with cobblestone, and a fountain in the middle of the square.",
    },
    exits: ["tavern", "forest"],
  },
  {
    data: {
      id: "forest",
      name: "The Forest",
      description:
        "The forest is a large area sporting a bounty of colorful foliage and wildlife. If you go deeper, you might find something interesting. But I haven't coded that in yet.",
    },
    exits: ["townSquare"],
  },
]

type LocationWithExits = Location & { exitLocations: Location[] }

let initialLocation: LocationWithExits | undefined

export async function createLocations() {
  logger.info("Creating locations")
  await Promise.all(
    locations.map(async (location) => {
      try {
        await db.location.upsert({
          where: { id: location.data.id },
          update: location.data,
          create: location.data,
        })

        logger.info(`Created location "${location.data.id}"`)
      } catch (error) {
        logger.error(`Error creating location "${location.data.id}"`)
        logger.error(getErrorInfo(error))
      }
    }),
  )

  logger.info("Creating exits")
  await Promise.all(
    locations.map(async (location, index) => {
      try {
        const newLocation = await db.location.update({
          where: { id: location.data.id },
          data: {
            exitLocations: {
              connect: location.exits.map((id) => ({ id })),
            },
          },
          include: {
            exitLocations: true,
          },
        })

        if (index === 0) {
          initialLocation = newLocation
        }

        logger.info(`Created exits for location "${location.data.id}"`)
      } catch (error) {
        logger.error(`Error creating exits for "${location.data.id}"`)
        logger.error(getErrorInfo(error))
      }
    }),
  )
}

export async function getLocation(id: string): Promise<LocationWithExits | undefined> {
  return (
    (await db.location.findUnique({
      where: { id },
      include: { exitLocations: true },
    })) ?? undefined
  )
}

export function getInitialLocationId() {
  return locations[0].data.id
}

export function getInitialLocation() {
  return initialLocation ?? raise("No initial location; call createLocations() first")
}
