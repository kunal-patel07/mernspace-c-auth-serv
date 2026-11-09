import Request from "express"

export interface UserData {
    firstName: string
    lastName: string
    email: string
    password: string
}

export interface ResgisterUserRequest extends Request {
    body: UserData
}
