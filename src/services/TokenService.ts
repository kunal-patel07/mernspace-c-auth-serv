import fs from "fs"
import jwt, { type JwtPayload } from "jsonwebtoken"
import createHttpError from "http-errors"
import type { Repository } from "typeorm"
import { Config } from "../config/index.js"
import type { RefreshToken } from "../entities/RefreshToken.js"
import type { User } from "../entities/User.js"

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: Buffer
        try {
            privateKey = fs.readFileSync(
                new URL("../../certs/private.pem", import.meta.url),
            )
        } catch {
            throw createHttpError(500, "Error while reading private key")
        }

        return jwt.sign(payload, privateKey, {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: "auth-service",
        })
    }

    generateRefreshToken(payload: JwtPayload) {
        return jwt.sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: "auth-service",
            jwtid: String(payload.id),
        })
    }

    async persistRefreshToken(user: User) {
        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365

        return await this.refreshTokenRepository.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_YEAR),
        })
    }
}
