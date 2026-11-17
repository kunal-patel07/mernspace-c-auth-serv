/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { isJwt } from "../utils/index.js"
import { RefreshToken } from "../../src/entities/RefreshToken.js"
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
                password: " Kunal@12345",
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
                password: " Kunal@12345",
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
                password: " Kunal@12345",
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
                password: " Kunal@12345",
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

            expect(response.body?.id).toBe(user?.id)
        })

        it("should assign a customer role", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: " Kunal@12345",
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
                password: " Kunal@12345",
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
                password: " Kunal@12345",
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

        it("should return access token and refresh token inside a cookie", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "Kunal@12345",
            }

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            //ASSERT
            interface Headers {
                ["set-cookie"]: string[]
            }

            let accessToken = null
            let refreshToken = null
            const cookies = (response.headers as Headers)["set-cookie"] || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1]
                }

                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1]
                }
            })
            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })

        it("should persist refreshtoken in database", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunalpatel@google.com",
                password: "Kunal@12345",
            }

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            //ASSERT

            const refreshTokenRepo = connection.getRepository(RefreshToken)
            // const refreshTokens= await refreshTokenRepo.find();

            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId  = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()
            expect(tokens).toHaveLength(1)
        })
    })

    describe("fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "",
                password: " Kunal@12345",
            }

            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
        it("should return 400 status code if firstname is missing", async () => {
            const userData = {
                firstName: "",
                lastName: "Patel",
                email: "kunal@google.com",
                password: " Kunal@12345",
            }
            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
        it("should return 400 status code if lastname is missing", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "",
                email: "kunal@google.com",
                password: " Kunal@12345",
            }
            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
        it("should return 400 status code if password is missing", async () => {
            const userData = {
                firstName: "Kunal",
                lastName: "Patel",
                email: "kunal@google.com",
                password: "",
            }
            const response = await request(app)
                .post("/auth/register")
                .send(userData)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        describe("fields are not in proper format", () => {
            it("should trim the email field", async () => {
                //Arrange
                const userData = {
                    firstName: "Kunal",
                    lastName: "Patel",
                    email: " kunal@google.com ",
                    password: " Kunal@12345",
                }

                await request(app).post("/auth/register").send(userData)
                //Act
                const userRepository = connection.getRepository(User)

                const users = await userRepository.find()
                const user = users[0]
                expect(user.email).toBe("kunal@google.com")
            })
            it("should return 400 status code if email is not a valid email", async () => {
                const userData = {
                    firstName: "Kunal",
                    lastName: "Patel",
                    email: "kunalgoogle.com",
                    password: " Kunal@12345",
                }
                const response = await request(app)
                    .post("/auth/register")
                    .send(userData)
                const userRepository = connection.getRepository(User)
                const users = await userRepository.find()
                expect(response.statusCode).toBe(400)
                expect(users).toHaveLength(0)
            })
            it("should return 400 status code if password length is less than 8 character", async () => {
                const userData = {
                    firstName: "Kunal",
                    lastName: "Patel",
                    email: "kunal@google.com",
                    password: "Kunal",
                }
                const response = await request(app)
                    .post("/auth/register")
                    .send(userData)
                const userRepository = connection.getRepository(User)
                const users = await userRepository.find()
                expect(response.statusCode).toBe(400)
                expect(users).toHaveLength(0)
            })
            it("should return array of error messages if email is missing", async () => {
                const userData = {
                    firstName: "Kunal",
                    lastName: "Patel",
                    email: "",
                    password: "Kunal@12345",
                }
                const response = await request(app)
                    .post("/auth/register")
                    .send(userData)
                const userRepository = connection.getRepository(User)
                const users = await userRepository.find()
                expect(response.body.errors).toBeInstanceOf(Array)
                expect(response.body.errors).toHaveLength(1)
                expect(response.body.errors[0].msg).toBe("Email is required")
                expect(response.body.errors[0].path).toBe("email")
                expect(users).toHaveLength(0)
            })
        })
    })
})
