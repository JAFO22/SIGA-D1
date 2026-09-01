import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const resumen = asyncHandler(async (_req, res) => {
  res.json(await dashboardService.resumenDashboard());
});
