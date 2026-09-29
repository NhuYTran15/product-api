require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDatabase = require('./config/database');

const port = Number(process.env.PORT) || 3000;
let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(port, () => {
      console.log(`Product API is listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`Could not start the server: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
