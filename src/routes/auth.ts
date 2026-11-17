import express, { type NextFunction } from "express"
import { AuthController } from "../controllers/AuthControllers.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../config/data-source.js"
import { User } from "../entities/User.js"
import logger from "../config/logger.js"
import registerValidator from "../validators/register-validator.js"
import { TokenService } from "../services/TokenService.js"
import { RefreshToken } from "../entities/RefreshToken.js"

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)
const tokenService = new TokenService(refreshTokenRepository)
const authController = new AuthController(userService, logger, tokenService)
router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)
export default router
