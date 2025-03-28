import dotenv from "dotenv";
import neo4j from "neo4j-driver";

// Load environment variables
dotenv.config();

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    throw new Error("❌ Missing Neo4j connection details in .env file");
}

// Connect to Neo4j
const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    { disableLosslessIntegers: true }
);

const session = driver.session();

console.log("✅ Connected to Neo4j AuraDB");

export { driver, session };

