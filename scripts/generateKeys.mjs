import { generateKeyPairSync } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const certsPath = path.resolve(__dirname, "../certs")

fs.mkdirSync(certsPath, { recursive: true })

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
})

fs.writeFileSync(path.join(certsPath, "private.pem"), privateKey)
fs.writeFileSync(path.join(certsPath, "public.pem"), publicKey)

console.log("RSA keys generated successfully")
