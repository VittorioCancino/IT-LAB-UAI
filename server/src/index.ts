import { initializeServer } from "./server";

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

async function startServer() {
    try {
        const server = await initializeServer();

        server.listen(port, host, () => {
            console.log("API Up");
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();
