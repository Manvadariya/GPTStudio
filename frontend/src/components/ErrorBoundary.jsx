import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    fontFamily: 'monospace',
                    backgroundColor: '#fee2e2',
                    minHeight: '100vh'
                }}>
                    <h1 style={{ color: '#dc2626', fontSize: '24px', marginBottom: '20px' }}>
                        ⚠️ Something went wrong
                    </h1>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #fecaca'
                    }}>
                        <h2 style={{ color: '#b91c1c', marginBottom: '10px' }}>Error:</h2>
                        <pre style={{
                            color: '#991b1b',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            marginBottom: '20px'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h2 style={{ color: '#b91c1c', marginBottom: '10px' }}>Stack Trace:</h2>
                        <pre style={{
                            color: '#6b7280',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '12px'
                        }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
