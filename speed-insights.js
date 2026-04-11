// Vercel Speed Insights integration
// This file injects Speed Insights tracking into the application
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false, // Set to true for development debugging
});
