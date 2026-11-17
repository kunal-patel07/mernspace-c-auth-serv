import app from "./app.js"
import { AppDataSource } from "./config/data-source.js"
import { Config } from "./config/index.js"
import logger from "./config/logger.js"

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info("database connected sucessfully")
        app.listen(PORT, () => {
            logger.info("server is listening on ", { port: PORT })
        })
    } catch (err: unknown) {
        if (err instanceof Error) {
            logger.error(err.message)
            setTimeout(() => {
                process.exit(1)
            }, 1000)
        }
    }
}
void startServer()
