/**
 * Download a JSON string as a file via browser download dialog.
 * Extracted from ChatView.tsx for reuse across components.
 */
export function downloadJson(jsonData: string, filename: string): void {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
