import express from "express"

const router = express.Router()

router.post("/auth/register", (req, res) => {
    res.status(201)
    res.send()
})
export default router
