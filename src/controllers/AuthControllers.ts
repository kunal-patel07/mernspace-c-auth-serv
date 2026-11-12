import type { NextFunction, Response } from "express"
import type { ResgisterUserRequest } from "../types/index.js"
import { UserService } from "../services/UserService.js"
import type { Logger } from "winston"
import bcrypt from "bcrypt"
import { validationResult } from "express-validator"
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
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { firstName, lastName, email, password } = req.body

        //hash the password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
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
                password: hashedPassword,
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
