
const app = require("./app");
const testConnection=require('./database/testConnection');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const env =require('./config/env')


const PORT=env.PORT||8000;

async function startServer() {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

app.use(notFound)
app.use(errorHandler);


startServer();
