import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client.ts";

export * from "../../prisma/generated/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
export const prisma = new PrismaClient({ adapter });
