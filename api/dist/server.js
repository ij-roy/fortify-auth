"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = Number(process.env.API_PORT ?? 3001);
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
