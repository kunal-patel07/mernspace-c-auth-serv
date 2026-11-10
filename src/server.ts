import app from "./app.js"
import { Config } from "./config/index.js"
import logger from "./config/logger.js"

const startServer = () => {
    const PORT = Config.PORT
    // console.log("object")
    try {
        app.listen(PORT, () => {
            logger.info("server is listening on ", { port: PORT })
        })
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
    }
}
startServer()
