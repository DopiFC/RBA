import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroLanding } from './components/home/HeroLanding';
import { ConsentScreen } from './components/consent/ConsentScreen';
import { SurveyWizard } from './components/survey/SurveyWizard';
import { ReportView } from './components/report/ReportView';
import { FeedbackForm } from './components/feedback/FeedbackForm';
import { generateFullReport } from './lib/reportEngine';
import { submitSurveyData, submitFeedbackData, syncWithServerConfig } from './lib/sheetsAdapter';
import { CONSENT_VERSION } from './config/survey';
import type { SurveyAnswers, SurveyScoringResult, SurveyFeedbackPayload } from './types/survey';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'consent' | 'survey' | 'report' | 'feedback'>('home');
  const [email, setEmail] = useState<string>('');
  const [contactPermission, setContactPermission] = useState<boolean>(false);
  const [responseId, setResponseId] = useState<string>(() => `RBA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [report, setReport] = useState<SurveyScoringResult | null>(null);

  // Pre-sync server configuration silently on mount
  useEffect(() => {
    syncWithServerConfig();
  }, []);

  // Check query params on mount (e.g. autostart for quick test)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setEmail('participant@rba-test.edu.vn');
      setCurrentTab('survey');
    }
  }, []);

  const handleStartSurvey = () => {
    if (email) {
      setCurrentTab('survey');
    } else {
      setCurrentTab('consent');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConsentSuccess = (verifiedEmail: string, allowContact: boolean) => {
    setEmail(verifiedEmail);
    setContactPermission(allowContact);
    setCurrentTab('survey');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSurvey = async (): Promise<{ success: boolean; error?: string }> => {
    const payload = {
      responseId,
      email,
      consentAccepted: true,
      consentVersion: CONSENT_VERSION,
      contactPermission,
      answers,
      clientTimestamp: new Date().toISOString(),
    };

    const res = await submitSurveyData(payload);

    if (!res.success) {
      return { success: false, error: res.error || 'Máy chủ phản hồi lỗi khi ghi nhận khảo sát.' };
    }

    // Compute and generate full diagnostic report
    const fullReport = generateFullReport(answers, responseId, new Date().toISOString());
    setReport(fullReport);
    setCurrentTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return { success: true };
  };

  const handleSubmitFeedback = async (payload: SurveyFeedbackPayload): Promise<{ success: boolean; error?: string }> => {
    const res = await submitFeedbackData(payload);
    if (!res.success) {
      return { success: false, error: res.error || 'Lỗi lưu phản hồi.' };
    }
    return { success: true };
  };

  const handleRetakeSurvey = () => {
    const newId = `RBA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setResponseId(newId);
    setAnswers({});
    setReport(null);
    setCurrentTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      <Navbar
        currentTab={currentTab === 'consent' ? 'survey' : currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'survey' && !email) {
            setCurrentTab('consent');
          } else {
            setCurrentTab(tab);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasResult={report !== null}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {currentTab === 'home' && (
          <HeroLanding
            onStartSurvey={handleStartSurvey}
          />
        )}

        {currentTab === 'consent' && (
          <ConsentScreen
            initialEmail={email}
            onConsentSuccess={handleConsentSuccess}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'survey' && (
          <SurveyWizard
            email={email}
            responseId={responseId}
            answers={answers}
            onUpdateAnswers={(newAnswers) => setAnswers(newAnswers)}
            onSubmitSurvey={handleSubmitSurvey}
            onBackToConsent={() => setCurrentTab('consent')}
          />
        )}

        {currentTab === 'report' && report && (
          <ReportView
            report={report}
            answers={answers}
            email={email}
            onOpenFeedback={() => setCurrentTab('feedback')}
            onBackHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'feedback' && (
          <FeedbackForm
            responseId={responseId}
            onBackToReport={() => setCurrentTab('report')}
            onSubmitFeedback={handleSubmitFeedback}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
