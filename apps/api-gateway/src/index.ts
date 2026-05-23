import { app } from './app';
import { config } from './config/env';

app.listen(config.server.port, () => {
  console.log('Gateway started');
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
