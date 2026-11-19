import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from "@jest/globals"
import type { DataSource } from "typeorm"
import { AppDataSource } from "../../src/config/data-source.js"
import request from "supertest"
import app from "../../src/app.js"
import { createRequire } from "node:module"
import type { JWKSMock } from "mock-jwks"
import { User } from "../../src/entities/User.js"
import { Roles } from "../../src/constants/index.js"
const { default: createJWKSMock } = createRequire(import.meta.url)(
    "mock-jwks",
) as typeof import("mock-jwks")
describe("GET /auth/self", () => {
    let connection: DataSource
    let jwks: JWKSMock

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501")
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()

        await AppDataSource.dropDatabase()
        await AppDataSource.synchronize()
    })

    afterEach(() => {
        jwks?.stop()
    })
    afterAll(async () => {
        if (connection?.isInitialized) await connection.destroy()
    })

    describe("given all fields", () => {
        it("should return the 200 status code", async () => {
            const accessToken = jwks.token({
                sub: "1",
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should return user data", async () => {
            // ARRANGE
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "Kunal@12345",
            }

            const userRepository = AppDataSource.getRepository(User)

            // const hashedPassword = await bcrypt.hash(userData.password, 10)

            const data = await userRepository.save({
                ...userData,
                // password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            // ACT
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])

            // ASSERT
            expect(response.body).toEqual(
                expect.objectContaining({
                    user: expect.objectContaining({ id: data.id }),
                }),
            )
        })
    })
})
