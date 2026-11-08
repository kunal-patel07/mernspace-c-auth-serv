import app from "../../src/app.js"

import { describe, it, expect } from "@jest/globals"
import request from "supertest"
describe("POST /auth/register", () => {
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
    })
    describe("fields are missing", () => {})
})
