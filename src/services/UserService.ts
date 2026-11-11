import type { Repository } from "typeorm"
import { User } from "../entities/User.js"
import type { UserData } from "../types/index.js"
import createHttpError from "http-errors"
import { Roles } from "../constants/index.js"

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstName, lastName, email, password }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })
        if (user) {
            const error = createHttpError(400, "email already exists!")
            throw error
        }
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
                role: Roles.CUSTOMER,
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to store user data in the database",
            )
            throw error
        }
    }
}
