export const WIDGET_STYLES = `
.us-widget-root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  margin: 12px 0;
  display: block;
}
.us-widget-root * {
  box-sizing: border-box;
}
.us-widget-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  transition: all 0.2s ease;
}
.us-widget-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}
.us-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.us-badge-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.us-badge-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}
.us-badge-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}
.us-title-group {
  display: flex;
  flex-direction: column;
}
.us-tagline {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
}
.us-recommendation-text {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}
.us-size-pill {
  background: #4f46e5;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 6px;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
}
.us-confidence-pill {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
}
.us-action-btn {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.us-action-btn:hover {
  background: #f1f5f9;
  color: #3730a3;
}
.us-details-toggle {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
  font-size: 12px;
  color: #475569;
  line-height: 1.4;
}
.us-fit-note {
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}
.us-metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 6px;
}
.us-metrics-table th {
  text-align: left;
  color: #64748b;
  font-weight: 600;
  padding: 4px 6px;
  border-bottom: 1px solid #f1f5f9;
}
.us-metrics-table td {
  padding: 4px 6px;
  color: #1e293b;
  border-bottom: 1px solid #f8fafc;
}
.us-status-ideal {
  color: #059669;
  font-weight: 600;
}
.us-status-tight {
  color: #d97706;
  font-weight: 600;
}
.us-status-loose {
  color: #2563eb;
  font-weight: 600;
}
.us-empty-state-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 12px 16px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.us-empty-state-btn:hover {
  background: #ffffff;
  border-color: #4f46e5;
  color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}
.us-loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: us-spin 0.8s linear infinite;
}
@keyframes us-spin {
  to { transform: rotate(360deg); }
}
.us-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.us-modal-dialog {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  height: 80vh;
  max-height: 720px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.us-modal-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.us-modal-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}
.us-modal-close {
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}
.us-modal-iframe {
  flex: 1;
  width: 100%;
  border: 0;
}
`;
