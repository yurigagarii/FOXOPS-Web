import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    dotenv.config({ path: ".env" });
} else {
    dotenv.config(); 
}

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const RIOT_API_KEY = process.env.RIOT_API_KEY;
export const HENRIK_API_KEY = process.env.HENRIK_API_KEY; 