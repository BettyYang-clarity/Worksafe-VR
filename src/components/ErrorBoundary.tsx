import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WorkSafe-VR Uncaught Component Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 bg-slate-950 text-white font-sans text-center select-none">
          <div className="p-5 max-w-sm rounded-2xl bg-slate-900 border border-amber-500/60 shadow-2xl space-y-3.5">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-amber-300">
              無塵室畫面重新載入中
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              手機背景切換或 GPU 暫態釋放，請點擊下方按鈕即可立即恢復最佳遊戲體驗：
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新載入無塵室 (Reload)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
