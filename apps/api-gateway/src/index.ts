import { app } from './app';
import { PORT } from './config/env';

app.listen(PORT, () => {
  console.log('Gateway started');
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
