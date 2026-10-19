import app from "./src/app.js";
import { config } from "./src/config/config.js";
import connectToDB from "./src/config/database.js";

const startServer = async () => {
    await connectToDB();
    app.listen(config.PORT, () => {
        console.log(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
    });
};

startServer();