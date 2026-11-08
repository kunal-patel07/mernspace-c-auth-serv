/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    verbose: true,
    extensionsToTreatAsEsm: [".ts"],

    transform: {
        "^.+\\.tsx?$": [
            "@swc/jest",
            {
                jsc: {
                    parser: { syntax: "typescript" },
                    target: "es2022",
                },
                module: {
                    type: "es6",
                },
            },
        ],
    },

    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },

    testMatch: ["**/*.spec.ts", "**/*.test.ts"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
}
