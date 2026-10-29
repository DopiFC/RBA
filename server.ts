import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataStore } from './server/dataStore';
import { configStore } from './server/configStore';
import type { SurveySubmissionPayload, SurveyFeedbackPayload } from './src/types/survey';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '2mb' }));

// --- PUBLIC & PARTICIPANT API ROUTES ONLY ---

// Health check endpoint (hardened: zero internal spreadsheet or database IDs leaked)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Check if email has already submitted (strictly enforces: 1 email only 1 survey)
app.get('/api/survey/check-email', (req: Request, res: Response) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    res.json({ status: 'ok', exists: false });
    return;
  }
  const exists = dataStore.isEmailAlreadySubmitted(email);
  res.json({ status: 'ok', exists });
});

// Submit Survey
app.post('/api/survey/submit', async (req: Request, res: Response) => {
  try {
    const payload = req.body as SurveySubmissionPayload;

    if (!payload || !payload.responseId) {
      res.status(400).json({ error: 'Thiếu thông tin khảo sát hợp lệ.' });
      return;
    }

    if (!payload.consentAccepted) {
      res.status(400).json({ error: 'Người tham gia chưa đồng thuận điều khoản nghiên cứu.' });
      return;
    }

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      res.status(400).json({ error: 'Địa chỉ email không hợp lệ.' });
      return;
    }

    const saveResult = await dataStore.saveSurveySubmission(payload);

    if (!saveResult.success) {
      res.status(500).json({ error: saveResult.error || 'Lỗi ghi nhận dữ liệu khảo sát.' });
      return;
    }

    let storedInGoogleSheets = saveResult.storedInGoogleSheets;
    let emailSent = false;

    // Forward to owner's Google Apps Script Web App securely on server-side
    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL || configStore.get().appsScriptUrl;
    if (appsScriptUrl) {
      try {
        const fullPayload = {
          type: 'survey',
          ...payload,
        };
        const scriptRes = await fetch(appsScriptUrl, {
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

    // Forward feedback to Google Apps Script if available
    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL || configStore.get().appsScriptUrl;
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ type: 'feedback', ...payload }),
        });
      } catch (err) {
        console.warn('[Server] Error forwarding feedback to Apps Script:', err);
      }
    }

    res.json({
      success: true,
      feedbackId: payload.feedbackId,
      storedInGoogleSheets: result.storedInGoogleSheets,
    });
  } catch (err: any) {
    console.error('[API /api/feedback/submit] Error:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lưu ý kiến phản hồi.' });
  }
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
