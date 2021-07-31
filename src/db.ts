import { Database, SQLite3Connector } from "https://deno.land/x/denodb@v1.0.38/mod.ts"

const connector = new SQLite3Connector({ filepath: "./data/game.db" })

export const db = new Database(connector)
