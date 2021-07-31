import createLogger from "pino"

export const logger = createLogger({
  prettyPrint: {
    colorize: true,
    ignore: "hostname,pid",
    translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
  },
})
