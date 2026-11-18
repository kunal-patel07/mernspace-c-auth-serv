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

describe("POST /auth/login", () => {
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

    describe("given all valid credential", () => {
        it("should return valid json response", async () => {
            const userData = {
                email: "kunalpatel@google.com",
                password: " Kunal@12345",
            }
            const response = await request(app)
                .post("/auth/login")
                .send(userData)
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("application/json"),
            )
        })
    })
})
