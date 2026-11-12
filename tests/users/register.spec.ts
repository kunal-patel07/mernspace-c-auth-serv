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
import { Roles } from "../../src/constants/index.js"
describe("POST /auth/register", () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await AppDataSource.dropDatabase()
        await AppDataSource.synchronize()
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

        it("should return id of created user", async () => {
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
            //ASSERT
            const userRepository = connection.getRepository(User)

            const user = await userRepository.findOneBy({
                email: userData.email,
            })
            expect(response.body).toHaveProperty("id")
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.body?.id).toBe(user?.id)
        })

        it("should assign a customer role", async () => {
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

            //ASSERT
            expect(users[0]).toHaveProperty("role")
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it("should store the hashed password in the database", async () => {
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

            //ASSERT
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it("should return 400 status code if email is already exists", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "secret",
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })
            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            const users = await userRepository.find()
            //ASSERT
            expect(response.statusCode).toBe(400)
            expect(users.length).toBe(1)
        })
    })

    describe("fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "",
                password: "secret",
            }

            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })
})
