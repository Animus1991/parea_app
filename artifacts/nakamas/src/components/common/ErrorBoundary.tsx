import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LanguageContext } from '../../lib/i18n';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public declare props: Props;
  public state: State = { hasError: false };

  // Enable access to i18n t() within class component
  static contextType = LanguageContext;
  declare context: React.ContextType<typeof LanguageContext>;


  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const t = this.context?.t ?? ((gr: string, en?: string) => en ?? gr);
      if (this.props.fallback) {
          return <>{this.props.fallback}</>;
      }
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-red-800 font-bold mb-2">{t('Κάτι πήγε στραβά', 'Something went wrong')}</h2>
          <p className="text-[18px] text-red-600">
             {this.state.error?.message || t('Προέκυψε ένα απρόσμενο σφάλμα.', 'An unexpected error occurred.')}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
