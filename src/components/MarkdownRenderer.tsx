import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple, safe, robust markdown parsing for streaming LLM text
  const renderFormattedText = (text: string) => {
    // Process lines
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (key: string) => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const rows = tableRows.slice(1).filter((r) => !r.every((cell) => cell.includes('---')));
        elements.push(
          <div key={key} className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {header.map((cell, idx) => (
                    <th key={idx} className="p-2 border-r border-slate-200 dark:border-slate-700 last:border-none">
                      {parseInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 last:border-none"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-none">
                        {parseInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check table row
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(`table-${index}`);
        inTable = false;
      }

      if (!trimmed) {
        elements.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1 flex items-center gap-1.5">
            {parseInline(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="text-base font-bold text-sky-950 dark:text-sky-100 mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
            {parseInline(trimmed.substring(3))}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={index} className="text-lg font-extrabold text-sky-900 dark:text-sky-200 mt-4 mb-2">
            {parseInline(trimmed.substring(2))}
          </h2>
        );
      }
      // Bullet lists
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-5 list-disc text-slate-700 dark:text-slate-300 text-sm my-0.5 leading-relaxed">
            {parseInline(trimmed.substring(2))}
          </li>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmed)) {
        const textPart = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={index} className="ml-5 list-decimal text-slate-700 dark:text-slate-300 text-sm my-0.5 leading-relaxed">
            {parseInline(textPart)}
          </li>
        );
      }
      // Blockquote / Advisory box
      else if (trimmed.startsWith('>')) {
        const isAlert = trimmed.includes('⚠️') || trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('alert');
        elements.push(
          <div
            key={index}
            className={`my-2 p-2.5 rounded-lg border-l-4 text-xs ${
              isAlert
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200'
                : 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200'
            }`}
          >
            {parseInline(trimmed.substring(1).trim())}
          </div>
        );
      }
      // Standard paragraph
      else {
        elements.push(
          <p key={index} className="text-sm text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
            {parseInline(trimmed)}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable('table-end');
    }

    return elements;
  };

  // Inline formatting: bold (**text**), italic (*text*), code (`code`)
  const parseInline = (text: string): React.ReactNode => {
    // Regex matching bold, code, inline tags
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Bold **bold**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      // Code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);

      // Find earliest match
      let firstIndex = -1;
      let matchType = '';
      let matchLength = 0;
      let matchedContent = '';

      if (boldMatch && boldMatch.index !== undefined) {
        firstIndex = boldMatch.index;
        matchType = 'bold';
        matchLength = boldMatch[0].length;
        matchedContent = boldMatch[1];
      }

      if (codeMatch && codeMatch.index !== undefined) {
        if (firstIndex === -1 || codeMatch.index < firstIndex) {
          firstIndex = codeMatch.index;
          matchType = 'code';
          matchLength = codeMatch[0].length;
          matchedContent = codeMatch[1];
        }
      }

      if (firstIndex === -1) {
        parts.push(remaining);
        break;
      }

      if (firstIndex > 0) {
        parts.push(remaining.substring(0, firstIndex));
      }

      if (matchType === 'bold') {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-slate-900 dark:text-slate-100">
            {matchedContent}
          </strong>
        );
      } else if (matchType === 'code') {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 text-xs font-mono"
          >
            {matchedContent}
          </code>
        );
      }

      remaining = remaining.substring(firstIndex + matchLength);
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return <div className="space-y-1 font-sans">{renderFormattedText(content)}</div>;
};
