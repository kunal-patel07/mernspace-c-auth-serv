import type { Response } from "express"
import type { ResgisterUserRequest } from "../types/index.js"
import { UserService } from "../services/UserService.js"

export class AuthController {
    userService: UserService
    constructor(userService: UserService) {
        this.userService = userService
    }
    async register(req: ResgisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body

        await this.userService.create({ firstName, lastName, email, password })

        res.status(201).json()
    }
}
