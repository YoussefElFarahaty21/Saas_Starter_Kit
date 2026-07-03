import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './api/auth/authRoutes';
import userRoutes from './api/routes/userRoutes';
import billingRoutes from './api/routes/billingRoutes';
import adminRoutes from './api/routes/adminRoutes';
import stripeWebhookRoutes from './api/routes/stripeWebhookRoutes';
import webhookRoutes from './api/routes/webhookRoutes';
import teamRoutes from './api/routes/teamRoutes';
import usageRoutes from './api/routes/usageRoutes';
import apiKeyRoutes from './api/routes/apiKeyRoutes';
import integrationRoutes from './api/routes/integrationRoutes';
import { authMiddleware } from './middleware/authMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Raw body parser for Stripe webhook MUST come before express.json()
app.use('/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/billing', billingRoutes);
app.use('/admin', adminRoutes);
app.use('/team', teamRoutes);
app.use('/usage', authMiddleware, usageRoutes);
app.use('/apikeys', apiKeyRoutes);
app.use('/integrations', integrationRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/webhook', stripeWebhookRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
