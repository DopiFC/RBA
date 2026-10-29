import React from 'react';
import { BarChart3 } from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'survey' | 'report' | 'feedback';
  setCurrentTab: (tab: 'home' | 'survey' | 'report' | 'feedback') => void;
  hasResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  hasResult,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-base sm:text-xl shadow-xs">
              RBA
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                  Kinh tế Doanh nghiệp
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                  Nghiên cứu khoa học
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hệ thống chẩn đoán vi mô theo Kinh tế học cho nhà quản trị
              </p>
            </div>
          </button>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Giới thiệu
            </button>

            <button
              onClick={() => setCurrentTab('survey')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'survey'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Khảo sát
            </button>

            {hasResult && (
              <button
                onClick={() => setCurrentTab('report')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'report' || currentTab === 'feedback'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Báo cáo</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
