import express from "express"

const app = express()

app.get("/", (req, res) => {
    res.send("come to auth service")
})

export default app
