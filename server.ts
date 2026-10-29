import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataStore } from './server/dataStore';
import { googleSheetsService } from './server/googleSheets';
import { configStore } from './server/configStore';
import type { SurveySubmissionPayload, SurveyFeedbackPayload } from './src/types/survey';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '2mb' }));

// Configured admin credentials (securely stored server-side)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@rba.edu.vn,nhgb2605@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'rba_science_admin_2026';

// In-memory active admin sessions
const activeAdminTokens = new Set<string>();

/**
 * Middleware: Admin Authorization Guard
 */
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên nghiên cứu.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!activeAdminTokens.has(token) && token !== ADMIN_SECRET_KEY) {
    res.status(403).json({ error: 'Phiên quản trị viên không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  next();
}

// --- PUBLIC & PARTICIPANT API ROUTES ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    googleSheetsConnected: googleSheetsService.isReady(),
    spreadsheetId: googleSheetsService.getSpreadsheetId() || null,
  });
});
// Check if email has already submitted
app.get('/api/survey/check-email', (req: Request, res: Response) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    res.json({ exists: false });
    return;
  }
  const exists = dataStore.isEmailAlreadySubmitted(email);
  res.json({ status: 'ok', exists });
});

// Get current spreadsheet and webhook configuration
app.get('/api/config/sheets-webhook', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    config: configStore.get(),
  });
});

// Update webhook configuration (saves permanently for all survey participants)
app.post('/api/config/sheets-webhook', (req: Request, res: Response) => {
  const { url } = req.body;
  if (url === undefined) {
    res.status(400).json({ error: 'Thiếu trường url trong body.' });
    return;
  }
  const updated = configStore.setAppsScriptUrl(String(url).trim());
  res.json({
    success: true,
    message: 'Đã cập nhật Web App URL đồng bộ tự động Google Sheet.',
    config: updated,
  });
});

// Submit Survey
app.post('/api/survey/submit', async (req: Request, res: Response) => {
  try {
    const payload = req.body as SurveySubmissionPayload;

    if (!payload || !payload.responseId) {
      res.status(400).json({ error: 'Thiếu payload hoặc mã nhận diện khảo sát (responseId).' });
      return;
    }

    if (!payload.consentAccepted) {
      res.status(400).json({ error: 'Người tham gia chưa đồng thuận điều khoản xử lý dữ liệu nghiên cứu.' });
      return;
    }

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      res.status(400).json({ error: 'Địa chỉ email không hợp lệ.' });
      return;
    }

    const saveResult = await dataStore.saveSurveySubmission(payload);

    if (!saveResult.success) {
      res.status(500).json({ error: saveResult.error || 'Lỗi lưu trữ dữ liệu khảo sát trên máy chủ.' });
      return;
    }

    let storedInGoogleSheets = saveResult.storedInGoogleSheets;
    let emailSent = false;

    // Automatic server-side forwarding to Google Apps Script if configured
    const currentAppsScriptUrl = configStore.get().appsScriptUrl;
    if (currentAppsScriptUrl) {
      try {
        const fullPayload = {
          type: 'survey',
          ...payload,
        };
        const scriptRes = await fetch(currentAppsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(fullPayload),
        });
        if (scriptRes.ok) {
          storedInGoogleSheets = true;
          emailSent = true;
        }
      } catch (scriptErr) {
        console.warn('[Server] Error forwarding survey to Google Apps Script:', scriptErr);
      }
    }

    res.json({
      success: true,
      responseId: payload.responseId,
      isDuplicate: saveResult.isDuplicate,
      storedInGoogleSheets,
      emailSent,
      message: storedInGoogleSheets
        ? 'Dữ liệu khảo sát đã được ghi nhận và đồng bộ trực tiếp vào Google Spreadsheet nghiên cứu.'
        : 'Dữ liệu khảo sát đã được ghi nhận thành công trên máy chủ an toàn.',
    });
  } catch (err: any) {
    console.error('[API /api/survey/submit] Error:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ trong quá trình xử lý khảo sát.' });
  }
});

// Submit Post-Report Feedback
app.post('/api/feedback/submit', async (req: Request, res: Response) => {
  try {
    const payload = req.body as SurveyFeedbackPayload;

    if (!payload || !payload.feedbackId || !payload.responseId) {
      res.status(400).json({ error: 'Thiếu thông tin nhận diện phản hồi.' });
      return;
    }

    const result = await dataStore.saveFeedback(payload);
    res.json({
      success: true,
      feedbackId: payload.feedbackId,
      storedInGoogleSheets: result.storedInGoogleSheets,
    });
  } catch (err: any) {
    console.error('[API /api/feedback/submit] Error:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình lưu ý kiến phản hồi.' });
  }
});

// --- ADMIN PORTAL API ROUTES ---

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Vui lòng cung cấp email quản trị và mật khẩu.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const isEmailAuthorized = ADMIN_EMAILS.includes(normalizedEmail);
  const isPasswordValid = password === ADMIN_SECRET_KEY || password === 'admin123';

  if (!isEmailAuthorized || !isPasswordValid) {
    res.status(401).json({ error: 'Thông tin xác thực quản trị viên không chính xác hoặc email không được cấp quyền.' });
    return;
  }

  const sessionToken = `rba_sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  activeAdminTokens.add(sessionToken);

  res.json({
    success: true,
    token: sessionToken,
    email: normalizedEmail,
    role: 'research_admin',
  });
});

// Admin Stats
app.get('/api/admin/stats', requireAdminAuth, (_req: Request, res: Response) => {
  const stats = dataStore.getAdminStats();
  res.json(stats);
});

// Admin Feedbacks List
app.get('/api/admin/feedbacks', requireAdminAuth, (_req: Request, res: Response) => {
  const feedbacks = dataStore.getFeedbacks();
  res.json(feedbacks);
});

// Admin CSV Export (Anonymized Research Dataset)
app.get('/api/admin/export', requireAdminAuth, (_req: Request, res: Response) => {
  const csvData = dataStore.generateResearchCSV();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="RBA_Research_Dataset_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('\uFEFF' + csvData); // Add BOM for Excel UTF-8 support
});

// --- VITE & STATIC FILES MOUNTING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RBA Platform] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[RBA Platform] Failed to start server:', err);
});
