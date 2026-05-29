"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === "production") {
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center
            py-24 gap-4">
            <p className="text-sm text-neutral-400 uppercase
              tracking-widest">
              Something went wrong.
            </p>
            {this.state.eventId && (
              <p className="text-[10px] text-neutral-300">
                Ref: {this.state.eventId}
              </p>
            )}
            <button
              onClick={() =>
                this.setState({ hasError: false, eventId: null })
              }
              className="text-xs text-neutral-900 underline
                underline-offset-4 hover:text-[#E8001D] transition-colors
                uppercase tracking-widest"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}