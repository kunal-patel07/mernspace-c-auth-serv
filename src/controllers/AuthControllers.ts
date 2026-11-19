import type { NextFunction, Response } from "express"
import type { JwtPayload } from "jsonwebtoken"
import type { AuthRequest, ResgisterUserRequest } from "../types/index.js"
import { UserService } from "../services/UserService.js"
import { type Logger } from "winston"
import bcrypt from "bcrypt"
import { validationResult } from "express-validator"
import { TokenService } from "../services/TokenService.js"
import createHttpError from "http-errors"
import type { CredentialService } from "../services/CredentialService.js"
export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            const accessToken = this.tokenService.generateAccessToken(payload)
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, //1h
                httpOnly: true,
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
    async login(req: ResgisterUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { email, password } = req.body

        this.logger.debug("new request to login a user", {
            email,
            password: "******",
        })

        try {
            const user = await this.userService.findByEmail(email)
            if (!user) {
                const error = createHttpError(
                    400,
                    "email or password does not match",
                )
                next(error)
                return
            }

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            )
            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    "email or password does not match",
                )
                next(error)
                return
            }
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            const accessToken = this.tokenService.generateAccessToken(payload)
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, //1h
                httpOnly: true,
            })
            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, //1y
                httpOnly: true,
            })
            this.logger.info("User has been logged in", { user: user.id })
            res.json({ id: user.id })
        } catch (error) {
            next(error)
            this.logger.error("user is not registered")
            return
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub))
        res.json({ user })
    }
}
