import fs from "fs"
import type { NextFunction, Response } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken"
import type { ResgisterUserRequest } from "../types/index.js"
import { UserService } from "../services/UserService.js"
import { type Logger } from "winston"
import bcrypt from "bcrypt"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"
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

            let privateKey: Buffer
            try {
                privateKey = fs.readFileSync(
                    new URL("../../certs/private.pem", import.meta.url),
                )
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                const error = createHttpError(
                    500,
                    "Error while reading private key",
                )
                return next(error)
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            const accessToken = jwt.sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            })
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, //1h
                httpOnly: true,
            })

            const refreshToken = jwt.sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1y",
                issuer: "auth-service",
            })
            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, //1y
                httpOnly: true,
            })
            res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
            this.logger.error("user is not registered")
            return
        }
    }
}
