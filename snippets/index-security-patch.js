// --- Security & observability (lägg HÖGT upp i index.js) ---
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cors from 'cors';

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'https://omsorgsplus.se',
    credentials: true,
  })
);

// Enkel health check
app.get('/healthz', (req, res) => res.json({ ok: true }));
