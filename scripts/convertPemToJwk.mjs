import fs from "fs"
import rsaPemToJwk from "rsa-pem-to-jwk"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const certsPath = path.resolve(__dirname, "../certs/private.pem")
const privateKey = fs.readFileSync(certsPath)
const jwk = rsaPemToJwk(privateKey, { use: "sig" }, "public")

console.log(JSON.stringify(jwk))
