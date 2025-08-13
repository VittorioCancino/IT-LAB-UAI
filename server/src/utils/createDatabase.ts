import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function createDatabase() {
    const databaseUrl = process.env.DATABASE_URL!;
    const urlParts = new URL(databaseUrl);
    const databaseName = urlParts.pathname.slice(1); // Remove leading slash

    // Create connection to postgres (default database)
    const adminDbUrl = databaseUrl.replace(`/${databaseName}`, "/postgres");

    const client = new Client({
        connectionString: adminDbUrl,
    });

    try {
        await client.connect();

        // Check if database exists
        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [databaseName],
        );

        if (result.rows.length === 0) {
            console.log(`Creating database: ${databaseName}`);
            await client.query(`CREATE DATABASE "${databaseName}"`);
            console.log(`Database ${databaseName} created successfully`);
        } else {
            console.log(`Database ${databaseName} already exists`);
        }
    } catch (error) {
        console.error("Error creating database:", error);
        throw error;
    } finally {
        await client.end();
    }
}

export { createDatabase };
