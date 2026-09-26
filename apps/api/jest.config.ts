import type { Config } from "jest";

const config: Config = {
  verbose: true,
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  setupFiles: ["<rootDir>/../test/helper/env.ts"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  detectOpenHandles: true,
  forceExit: true,
};

export default config;
