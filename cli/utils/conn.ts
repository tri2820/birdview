import { DATABASE_PATH } from "../definitions";
import { initializeDatabase } from "./database";

export const connection = await initializeDatabase(DATABASE_PATH);