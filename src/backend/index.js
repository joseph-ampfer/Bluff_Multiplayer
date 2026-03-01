import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;
const { httpServer } = createApp();

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
