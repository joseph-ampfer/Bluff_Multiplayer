import { createApp } from './app.js';
import { closeMongo } from './mongoPersistence.js';

const PORT = process.env.PORT || 3000;
const { httpServer } = await createApp();

process.once('SIGINT', async () => {
  await closeMongo();
  process.exit(0);
});
process.once('SIGTERM', async () => {
  await closeMongo();
  process.exit(0);
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
