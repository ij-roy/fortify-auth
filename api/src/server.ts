import express from "express";

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});