import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express"
import type { AuthRequest } from "../types/index.js"

import { AuthController } from "../controllers/AuthControllers.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../config/data-source.js"
import { User } from "../entities/User.js"
import logger from "../config/logger.js"
import registerValidator from "../validators/register-validator.js"
import { TokenService } from "../services/TokenService.js"
import { RefreshToken } from "../entities/RefreshToken.js"
import loginValidator from "../validators/login-validator.js"
import { CredentialService } from "../services/CredentialService.js"
import authenticate from "../middlewares/authenticate.js"

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)
const tokenService = new TokenService(refreshTokenRepository)
const credentialService = new CredentialService()
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
)
router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)

router.post(
    "/login",
    loginValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next),
)
router.get("/self", authenticate, (req: Request, res: Response) =>
    authController.self(req as AuthRequest, res),
)
export default router
