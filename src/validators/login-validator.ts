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

    password: {
        trim: true,
        errorMessage: "password is required",
        notEmpty: true,
    },
})
// export default [body("email").notEmpty().withMessage("email is required")]
