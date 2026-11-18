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
import app from "../../src/app.js"
import bcrypt from "bcrypt"
import jwt, { type JwtPayload } from "jsonwebtoken"
import fs from "node:fs"
import { User } from "../../src/entities/User.js"
import { RefreshToken } from "../../src/entities/RefreshToken.js"
import { Roles } from "../../src/constants/index.js"
import { Config } from "../../src/config/index.js"
import { isJwt } from "../utils/index.js"

const credentials = {
    email: "kunalpatel@google.com",
    password: "Kunal@12345",
}

const getCookies = (response: request.Response): string[] => {
    const cookies = response.headers["set-cookie"]
    return Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
}

const getToken = (response: request.Response, name: string): string => {
    const cookie = getCookies(response).find((value) =>
        value.startsWith(`${name}=`),
    )
    expect(cookie).toBeDefined()
    return decodeURIComponent(cookie!.split(";")[0].slice(name.length + 1))
}

describe("POST /auth/login", () => {
    let connection: DataSource
    let user: User
    let hashedPassword: string

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
        hashedPassword = await bcrypt.hash(credentials.password, 10)
    })

    beforeEach(async () => {
        await AppDataSource.dropDatabase()
        await AppDataSource.synchronize()
        // ARRANGE: login requires an existing user with a hashed password.
        user = await connection.getRepository(User).save({
            firstName: "Kunal",
            lastName: "Patel",
            ...credentials,
            password: hashedPassword,
            role: Roles.CUSTOMER,
        })
    })
    afterAll(async () => {
        if (connection?.isInitialized) await connection.destroy()
    })

    describe("given all valid credential", () => {
        it("should return 201 status code", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)

            expect(response.statusCode).toBe(201)
        })

        it("should return valid json response", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)
            expect(response.statusCode).toBe(201)
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("application/json"),
            )
        })

        it("should return the id of the existing user without exposing the password", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)

            expect(response.statusCode).toBe(201)
            expect(response.body).toEqual({ id: user.id })
            expect(response.text).not.toContain(credentials.password)
            expect(response.text).not.toContain(hashedPassword)
        })

        it("should not create another user or change the existing password", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)

            expect(response.statusCode).toBe(201)
            const users = await connection.getRepository(User).find()
            expect(users).toHaveLength(1)
            expect(users[0]).toMatchObject({
                id: user.id,
                email: credentials.email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })
        })

        it("should return access token and refresh token inside HTTP-only cookies", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)

            expect(response.statusCode).toBe(201)
            expect(isJwt(getToken(response, "accessToken"))).toBe(true)
            expect(isJwt(getToken(response, "refreshToken"))).toBe(true)
            for (const name of ["accessToken", "refreshToken"]) {
                const cookie = getCookies(response).find((value) =>
                    value.startsWith(`${name}=`),
                )!
                expect(cookie).toContain("HttpOnly")
                expect(cookie).toContain("SameSite=Strict")
                expect(cookie).toContain(
                    `Max-Age=${name === "accessToken" ? 3600 : 31536000}`,
                )
            }
        })

        it("should sign an access token with the existing user's id and role", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)
            const publicKey = fs.readFileSync(
                new URL("../../certs/public.pem", import.meta.url),
            )
            const payload = jwt.verify(
                getToken(response, "accessToken"),
                publicKey,
                { algorithms: ["RS256"], issuer: "auth-service" },
            ) as JwtPayload

            expect(payload).toMatchObject({
                sub: String(user.id),
                role: Roles.CUSTOMER,
            })
            expect(payload.exp! - payload.iat!).toBe(60 * 60)
        })

        it("should persist a refresh token linked to the user and the signed JWT", async () => {
            const startedAt = Date.now()
            const response = await request(app)
                .post("/auth/login")
                .send(credentials)
            const finishedAt = Date.now()
            const tokens = await connection.getRepository(RefreshToken).find({
                relations: { user: true },
            })

            expect(response.statusCode).toBe(201)
            expect(tokens).toHaveLength(1)
            expect(tokens[0].user.id).toBe(user.id)
            const yearInMs = 1000 * 60 * 60 * 24 * 365
            expect(tokens[0].expiresAt.getTime()).toBeGreaterThanOrEqual(
                startedAt + yearInMs,
            )
            expect(tokens[0].expiresAt.getTime()).toBeLessThanOrEqual(
                finishedAt + yearInMs,
            )
            const payload = jwt.verify(
                getToken(response, "refreshToken"),
                Config.REFRESH_TOKEN_SECRET!,
                { algorithms: ["HS256"], issuer: "auth-service" },
            ) as JwtPayload
            expect(payload).toMatchObject({
                sub: String(user.id),
                role: Roles.CUSTOMER,
                jti: String(tokens[0].id),
            })
            expect(payload.exp!).toBeGreaterThan(payload.iat!)
        })

        it("should trim whitespace around the email before login", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ ...credentials, email: ` ${credentials.email} ` })

            expect(response.statusCode).toBe(201)
            expect(response.body).toEqual({ id: user.id })
        })

        it("should use the stored role instead of a role supplied in the request", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ ...credentials, role: Roles.ADMIN })
            const publicKey = fs.readFileSync(
                new URL("../../certs/public.pem", import.meta.url),
            )
            const payload = jwt.verify(
                getToken(response, "accessToken"),
                publicKey,
                { algorithms: ["RS256"], issuer: "auth-service" },
            ) as JwtPayload

            expect(response.statusCode).toBe(201)
            expect(payload.role).toBe(Roles.CUSTOMER)
            const savedUser = await connection
                .getRepository(User)
                .findOneByOrFail({ id: user.id })
            expect(savedUser.role).toBe(Roles.CUSTOMER)
        })

        it("should create separate refresh token records for repeated logins", async () => {
            const first = await request(app)
                .post("/auth/login")
                .send(credentials)
            const second = await request(app)
                .post("/auth/login")
                .send(credentials)

            expect(first.statusCode).toBe(201)
            expect(second.statusCode).toBe(201)
            expect(getToken(first, "refreshToken")).not.toBe(
                getToken(second, "refreshToken"),
            )
            const tokens = await connection.getRepository(RefreshToken).find({
                where: { user: { id: user.id } },
            })
            expect(tokens).toHaveLength(2)
            expect(await connection.getRepository(User).count()).toBe(1)
        })
    })

    describe("given invalid credentials", () => {
        it.each([
            [
                "email does not exist",
                { ...credentials, email: "unknown@google.com" },
            ],
            [
                "password is incorrect",
                { ...credentials, password: "Wrong@12345" },
            ],
            [
                "password has different casing",
                { ...credentials, password: "kunal@12345" },
            ],
            [
                "stored password hash is sent as the password",
                { ...credentials, password: "use-stored-hash" },
            ],
        ])(
            "should return 400 when %s without creating a session",
            async (_name, input) => {
                const response = await request(app)
                    .post("/auth/login")
                    .send({
                        ...input,
                        password:
                            input.password === "use-stored-hash"
                                ? hashedPassword
                                : input.password,
                    })

                expect(response.statusCode).toBe(400)
                expect(response.body).toMatchObject({
                    errors: { msg: "email or password does not match" },
                })
                expect(getCookies(response)).toHaveLength(0)
                expect(
                    await connection.getRepository(RefreshToken).count(),
                ).toBe(0)
                expect(await connection.getRepository(User).count()).toBe(1)
            },
        )
    })

    describe("fields are missing or not in proper format", () => {
        it.each([
            ["email is missing", { password: credentials.password }, "email"],
            ["email is empty", { ...credentials, email: "" }, "email"],
            ["email is whitespace", { ...credentials, email: "   " }, "email"],
            ["email is null", { ...credentials, email: null }, "email"],
            [
                "email is invalid",
                { ...credentials, email: "kunalgoogle.com" },
                "email",
            ],
            ["password is missing", { email: credentials.email }, "password"],
            ["password is empty", { ...credentials, password: "" }, "password"],
            [
                "password is whitespace",
                { ...credentials, password: "   " },
                "password",
            ],
            [
                "password is null",
                { ...credentials, password: null },
                "password",
            ],
        ])("should return 400 when %s", async (_name, input, field) => {
            const response = await request(app).post("/auth/login").send(input)

            expect(response.statusCode).toBe(400)
            expect(response.body).toMatchObject({
                errors: expect.arrayContaining([
                    expect.objectContaining({ path: field, location: "body" }),
                ]),
            })
            expect(getCookies(response)).toHaveLength(0)
            expect(await connection.getRepository(RefreshToken).count()).toBe(0)
            expect(await connection.getRepository(User).count()).toBe(1)
        })

        it("should return errors for both fields when the request body is empty", async () => {
            const response = await request(app).post("/auth/login").send({})

            expect(response.statusCode).toBe(400)
            expect(response.body).toMatchObject({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        path: "email",
                        msg: "Email is required",
                    }),
                    expect.objectContaining({
                        path: "password",
                        msg: "password is required",
                    }),
                ]),
            })
            expect(getCookies(response)).toHaveLength(0)
            expect(await connection.getRepository(RefreshToken).count()).toBe(0)
        })
    })
})
