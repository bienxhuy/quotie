import { createServer } from 'http';
import app from "./app";
import { AppDataSource } from "./data-source";

const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT} \nAPI Docs: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });