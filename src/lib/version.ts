import pkg from "../../package.json" assert { type: "json" };

export const APP_VERSION: string = (pkg as { version: string }).version;
