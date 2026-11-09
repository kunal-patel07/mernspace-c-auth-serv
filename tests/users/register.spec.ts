import app from "../../src/app.js"

import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    afterAll,
} from "@jest/globals"
import request from "supertest"
import type { DataSource } from "typeorm"
import { AppDataSource } from "../../src/config/data-source.js"
import { User } from "../../src/entities/User.js"
import { truncateTables } from "../utils/index.js"
describe("POST /auth/register", () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await truncateTables(connection)
    })
    afterAll(async () => {
        await connection.destroy()
    })

    describe("given all fields", () => {
        it("should return 201 status code ", async () => {
            //AAA
            //ARRANGE
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "secret",
            }

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            //Assert
            expect(response.statusCode).toBe(201)
        })

        it("should return valid json response", async () => {
            //ARRANGE
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "secret",
            }

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("application/json"),
            )
        })

        it("should persist the user in database", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "secret",
            }

            //ACT

            await request(app).post("/auth/register").send(userData)

            const userRepository = connection.getRepository(User)

            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })
    })

    describe("fields are missing", () => {})
})
