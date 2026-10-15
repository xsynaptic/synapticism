import type { ReactNode } from 'react';

import { Component } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback: ReactNode;
}

interface ErrorBoundaryState {
	hasFailed: boolean;
}

// React has no hook for catching a render throw, so this is the package's one class
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	override state: ErrorBoundaryState = { hasFailed: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasFailed: true };
	}

	override render() {
		return this.state.hasFailed ? this.props.fallback : this.props.children;
	}
}
