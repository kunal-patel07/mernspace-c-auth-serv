import app from "./app.js"
import { Config } from "./config/index.js"
import logger from "./config/logger.js"

const startServer = () => {
    const PORT = Config.PORT
    try {
        app.listen(PORT, () => {
            logger.info("server is listening on ", { port: PORT })
        })
    } catch (error) {
        console.error(error)
    }
}
startServer()
