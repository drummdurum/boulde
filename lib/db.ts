import "server-only";
import neo4j, { type Driver, type Integer } from "neo4j-driver";

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
if (!uri || !username || !password) throw new Error("NEO4J_URI, NEO4J_USERNAME og NEO4J_PASSWORD skal være konfigureret.");

const globalForDb = globalThis as unknown as { bouldeNeo4jDriver?: Driver };
export const db = globalForDb.bouldeNeo4jDriver ?? neo4j.driver(uri, neo4j.auth.basic(username, password));
if (process.env.NODE_ENV !== "production") globalForDb.bouldeNeo4jDriver = db;
export const database = process.env.NEO4J_DATABASE || "neo4j";
export function neo4jNumber(value: number | Integer): number { return neo4j.isInt(value) ? value.toNumber() : value; }
