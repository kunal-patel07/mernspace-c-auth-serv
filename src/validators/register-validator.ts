import { checkSchema } from "express-validator"

export default checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
        isEmail: true,
    },
    firstName: {
        errorMessage: "firstname is required",
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: "lastname is required",
        notEmpty: true,
        trim: true,
    },
    password: {
        errorMessage: "password is required",
        notEmpty: true,
    },
})
// export default [body("email").notEmpty().withMessage("email is required")]
