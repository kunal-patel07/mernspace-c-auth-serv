import { checkSchema } from "express-validator"

export default checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
    },
})
// export default [body("email").notEmpty().withMessage("email is required")]
