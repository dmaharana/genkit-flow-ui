import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

interface Trace {
  traceId: string;
  displayName: string;
  startTime: number;
  endTime: number;
  spans: Record<string, any>;
}

export function Admin() {
  const [traceIds, setTraceIds] = useState<string[]>([])
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTraces()
  }, [])

  const fetchTraces = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/traces')
      if (!response.ok) throw new Error('Failed to fetch traces')
      const data = await response.json()
      // Ensure traceIds is always an array
      setTraceIds(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchTraceDetail = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/traces/${id}`)
      if (!response.ok) throw new Error('Failed to fetch trace detail')
      const data = await response.json()
      setSelectedTrace(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const safeParse = (str: string) => {
    if (!str) return '';
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          <h1>Genkit Admin <small>Traces</small></h1>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <button onClick={fetchTraces} disabled={loading} className="btn-primary refresh-btn">
            <span className="icon">⟳</span> Refresh Traces
          </button>
          <Link to="/" className="btn-secondary back-link">
             <span className="icon">←</span> Back to Generator
          </Link>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="trace-list">
          <div className="list-header">
            <h2>Recent Traces</h2>
          </div>
          {loading && !selectedTrace && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Fetching traces...</p>
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <ul>
            {(traceIds || []).map(id => (
              <li key={id} onClick={() => fetchTraceDetail(id)} className={selectedTrace?.traceId === id ? 'active' : ''}>
                <div className="trace-item-id">ID: {id.substring(0, 8)}...</div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="trace-detail">
          {selectedTrace ? (
            <div className="detail-content">
              <div className="detail-header">
                <h2>{selectedTrace.displayName}</h2>
                <div className="trace-meta">
                  <span className="meta-badge"><strong>Trace ID:</strong> {selectedTrace.traceId}</span>
                  <span className="meta-badge"><strong>Duration:</strong> {(selectedTrace.endTime - selectedTrace.startTime).toFixed(2)}ms</span>
                  <span className="meta-badge"><strong>Timestamp:</strong> {new Date(selectedTrace.startTime).toLocaleString()}</span>
                </div>
              </div>

              <div className="spans-section">
                <h3>Span Execution Tree</h3>
                <div className="spans-container">
                  {Object.values(selectedTrace.spans || {}).sort((a: any, b: any) => a.startTime - b.startTime).map((span: any) => (
                    <div key={span.spanId} className="span-card">
                      <div className="span-header">
                        <span className="span-name">{span.displayName}</span>
                        <span className="span-kind-badge">{span.spanKind}</span>
                      </div>
                      <div className="span-body">
                        {span.attributes?.['genkit:input'] && (
                          <div className="attribute">
                            <label>Input Data</label>
                            <pre className="code-block">{safeParse(span.attributes['genkit:input'])}</pre>
                          </div>
                        )}
                        {span.attributes?.['genkit:output'] && (
                          <div className="attribute">
                            <label>Output Data</label>
                            <pre className="code-block highlight-output">{safeParse(span.attributes['genkit:output'])}</pre>
                          </div>
                        )}
                        <details className="raw-details">
                          <summary>View raw span metadata</summary>
                          <pre className="code-block small">{JSON.stringify(span, null, 2)}</pre>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Select a trace from the sidebar to view execution details</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
