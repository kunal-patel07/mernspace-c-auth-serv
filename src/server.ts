import app from "./config/app.js"
import { Config } from "./config/index.js"

const startServer = () => {
    const PORT = Config.PORT
    try {
        app.listen(PORT, () => console.log(`listening on port ${PORT}`))
    } catch (error) {
        console.error(error)
    }
}
startServer()
