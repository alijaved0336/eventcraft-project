import { createServer } from 'http';
import { connectDB } from './lib/db';
import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { initSocket } from './lib/socket';

async function bootstrap() {
  try {
    // 1. Database Connection
    await connectDB();

    // 2. Create Express App
    const app = await createApp();

    // 3. Create HTTP Server for Socket.io support
    const server = createServer(app);

    // 4. Initialize Socket.io
    initSocket(server);

    // 5. Listen
    server.listen(config.port, () => {
      logger.info(`Server is running at http://localhost:${config.port}`);
      logger.info(`GraphQL Playground at http://localhost:${config.port}/graphql`);
      logger.info(`Route Discovery at http://localhost:${config.port}/api/routes`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

void bootstrap();
