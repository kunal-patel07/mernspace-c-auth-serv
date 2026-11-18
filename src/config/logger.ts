import winston from "winston"
import { Config } from "./index.js"
const logger = winston.createLogger({
    level: "info",
    defaultMeta: {
        serviceName: "auth-service",
    },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.File({
            level: "info",
            dirname: "logs",
            filename: "combined.log",
        }),
        new winston.transports.File({
            level: "error",
            dirname: "logs",
            filename: "errors.log",
        }),
        new winston.transports.Console({
            level: "info",

            silent: Config.NODE_ENV === "test",
        }),
    ],
})
export default logger
