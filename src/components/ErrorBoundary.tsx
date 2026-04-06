import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans" dir="rtl">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">عذراً، حدث خطأ غير متوقع</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                لقد واجه التطبيق مشكلة تقنية مفاجئة. يرجى تحديث الصفحة للمحاولة مرة أخرى.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" /> 
              <span>تحديث الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
