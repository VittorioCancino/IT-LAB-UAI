import server from "./server";

// Server contruction and deployment
// FIXME change console log to show actual working port
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
    console.log("API Up");
});
