import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: true }));       // låter oss testa fritt, låser senare
app.use(express.json());

app.get("/health", (_, res) => res.send("ok"));   // enkel test-route
app.get("/api/message", (_, res) => res.json({ msg: "Hello from backend!" }));

const port = process.env.PORT || 3000; // viktigt för Render
app.listen(port, () => console.log("API listening on " + port));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend fungerar!' })
})