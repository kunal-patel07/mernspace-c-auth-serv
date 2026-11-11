import type { NextFunction, Response } from "express"
import type { ResgisterUserRequest } from "../types/index.js"
import { UserService } from "../services/UserService.js"
import type { Logger } from "winston"

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}
    async register(
        req: ResgisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const { firstName, lastName, email, password } = req.body

        this.logger.debug("new request to register a user", {
            firstName,
            lastName,
            email,
            password: "******",
        })

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })
            this.logger.info("user has been registered", { id: user.id })
            res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
            this.logger.error("")
            return
        }
    }
}
