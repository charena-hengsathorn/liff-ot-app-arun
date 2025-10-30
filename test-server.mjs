import express from 'express';

const app = express();
const PORT = 3002; // Using a different port to avoid any conflicts

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.listen(PORT, () => {
  console.log(`[TEST] Minimal server running on http://localhost:${PORT}`);
  console.log('If this message stays and the cursor blinks, Express is working correctly.');
}); 