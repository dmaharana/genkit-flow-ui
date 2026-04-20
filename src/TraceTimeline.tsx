import { useState, useMemo } from 'react'

interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  startTime: number;
  endTime: number;
  displayName: string;
  spanKind: string;
  attributes?: Record<string, any>;
}

interface Trace {
  traceId: string;
  displayName: string;
  startTime: number;
  endTime: number;
  spans: Record<string, Span>;
}

interface TreeNode extends Span {
  children: TreeNode[];
  depth: number;
}

export function TraceTimeline({ trace }: { trace: Trace }) {
  const [expandedSpanId, setExpandedSpanId] = useState<string | null>(null)

  const { nodes, totalDuration } = useMemo(() => {
    const spans = Object.values(trace.spans)
    const totalDuration = trace.endTime - trace.startTime
    
    // Build tree
    const spanMap: Record<string, TreeNode> = {}
    spans.forEach(span => {
      spanMap[span.spanId] = { ...span, children: [], depth: 0 }
    })
    
    const rootNodes: TreeNode[] = []
    spans.forEach(span => {
      if (span.parentSpanId && spanMap[span.parentSpanId]) {
        spanMap[span.parentSpanId].children.push(spanMap[span.spanId])
      } else {
        rootNodes.push(spanMap[span.spanId])
      }
    })
    
    // Sort root nodes by start time
    rootNodes.sort((a, b) => a.startTime - b.startTime)
    
    // Flatten tree with depth
    const flattened: TreeNode[] = []
    const traverse = (node: TreeNode, depth: number) => {
      node.depth = depth
      node.children.sort((a, b) => a.startTime - b.startTime)
      flattened.push(node)
      node.children.forEach(child => traverse(child, depth + 1))
    }
    
    rootNodes.forEach(root => traverse(root, 0))
    
    return { nodes: flattened, totalDuration }
  }, [trace])

  const getSpanColor = (kind: string, name: string) => {
    if (name.includes('flow')) return '#4f46e5' // Indigo
    if (name.includes('model') || name.includes('generate')) return '#10b981' // Emerald
    if (kind === 'INTERNAL') return '#f59e0b' // Amber
    return '#64748b' // Slate
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
    <div className="timeline-view">
      <div className="timeline-header">
        <div className="timeline-axis">
          <span>0ms</span>
          <span>{(totalDuration / 2).toFixed(1)}ms</span>
          <span>{totalDuration.toFixed(1)}ms</span>
        </div>
      </div>
      <div className="timeline-body">
        {nodes.map(node => {
          const left = ((node.startTime - trace.startTime) / totalDuration) * 100
          const width = Math.max(((node.endTime - node.startTime) / totalDuration) * 100, 0.5)
          const duration = node.endTime - node.startTime
          const isExpanded = expandedSpanId === node.spanId
          
          return (
            <div key={node.spanId} className={`timeline-row-group ${isExpanded ? 'is-expanded' : ''}`}>
              <div 
                className={`timeline-row ${isExpanded ? 'active' : ''}`}
                onClick={() => setExpandedSpanId(isExpanded ? null : node.spanId)}
              >
                <div className="span-info" style={{ paddingLeft: `${node.depth * 20 + 10}px` }}>
                  <span className="span-name-label" title={node.displayName}>
                    {isExpanded ? '▼ ' : '▶ '}{node.displayName}
                  </span>
                  <span className="span-duration-label">
                    {duration.toFixed(1)}ms
                  </span>
                </div>
                <div className="span-timeline-track">
                  <div 
                    className="span-bar" 
                    style={{ 
                      left: `${left}%`, 
                      width: `${width}%`,
                      backgroundColor: getSpanColor(node.spanKind, node.displayName)
                    }}
                  >
                    <span className="bar-label">
                      {duration > (totalDuration * 0.1) ? `${duration.toFixed(1)}ms` : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="span-details-panel">
                  <div className="details-grid">
                    {node.attributes?.['genkit:input'] && (
                      <div className="detail-item">
                        <label>Input</label>
                        <pre>{safeParse(node.attributes['genkit:input'])}</pre>
                      </div>
                    )}
                    {node.attributes?.['genkit:output'] && (
                      <div className="detail-item">
                        <label>Output</label>
                        <pre className="highlight-output">{safeParse(node.attributes['genkit:output'])}</pre>
                      </div>
                    )}
                    <div className="detail-item">
                      <label>Metadata</label>
                      <pre className="small">{JSON.stringify({
                        spanId: node.spanId,
                        kind: node.spanKind,
                        startTime: new Date(node.startTime).toISOString(),
                        endTime: new Date(node.endTime).toISOString(),
                        ...node.attributes
                      }, (key, value) => {
                         // Filter out large inputs/outputs already shown
                         if (key === 'genkit:input' || key === 'genkit:output') return undefined;
                         return value;
                      }, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
