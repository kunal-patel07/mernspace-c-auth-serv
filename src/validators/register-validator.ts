import { checkSchema } from "express-validator"

export default checkSchema({
    email: {
        trim: true,
        notEmpty: {
            errorMessage: "Email is required",
            bail: true,
        },
        isEmail: {
            errorMessage: "Please enter a valid email address",
        },
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
        isLength: {
            options: { min: 8 },
            errorMessage: "Password must be at least 8 characters",
        },
    },
})
// export default [body("email").notEmpty().withMessage("email is required")]
