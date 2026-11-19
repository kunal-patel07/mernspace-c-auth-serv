import type { Request } from "express"
import { expressjwt, type GetVerificationKey } from "express-jwt"
import jwtClient from "jwks-rsa"
import { Config } from "../config/index.js"

export default expressjwt({
    secret: jwtClient.expressJwtSecret({
        jwksUri: Config.JWKS_URI!,
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ["RS256"],
    getToken(req: Request) {
        const authHeader = req.headers.authorization
        //Baerer sdfmkwelsdqlopskwao
        if (authHeader && authHeader.split(" ")[1] !== "undefined") {
            const token = authHeader.split(" ")[1]
            if (token) {
                return token
            }
        }
        type AuthCookie = {
            accessToken: string
        }
        const { accessToken } = req.cookies as AuthCookie
        return accessToken
    },
})
