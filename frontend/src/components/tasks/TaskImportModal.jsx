import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import tasksService from '../../services/tasks';
import projectsService from '../../services/projects';

const PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'];
const STATUS_VALUES = ['new', 'assigned', 'working', 'review_pending', 'approved', 'rejected', 'completed'];

const COL_MAP = {
  'title': 'title', 'task title': 'title', 'task name': 'title', 'name': 'title',
  'description': 'description', 'desc': 'description', 'detail': 'description',
  'topic': 'topic', 'topic name': 'topic',
  'priority': 'priority',
  'status': 'status',
  'due_date': 'due_date', 'due date': 'due_date', 'deadline': 'due_date',
};

export default function TaskImportModal({ projectId, onClose, onSuccess }) {
  const [topics, setTopics] = useState([]);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    projectsService.getAllTopics({ project: projectId })
      .then(data => setTopics(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [projectId]);

  const validateRows = (parsed, topicList) => {
    return parsed.map((row) => {
      const errs = [];
      if (!row.title) errs.push('Title is required');
      if (row.priority && !PRIORITY_VALUES.includes(row.priority.toLowerCase())) {
        errs.push(`Invalid priority "${row.priority}" (low/medium/high/urgent)`);
      }
      if (row.status && !STATUS_VALUES.includes(row.status.toLowerCase())) {
        errs.push(`Invalid status "${row.status}"`);
      }
      if (row.topic) {
        const found = topicList.find(t => t.name.toLowerCase() === row.topic.toLowerCase());
        if (!found) errs.push(`Topic "${row.topic}" not found`);
      }
      return errs;
    });
  };

  const parseFile = async (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Only CSV, XLSX and XLS files are supported');
      return;
    }

    try {
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rawRows.length < 2) {
        toast.error('File must have a header row and at least one data row');
        return;
      }

      const headers = rawRows[0].map(h => String(h).trim().toLowerCase());
      const fieldMap = headers.map(h => COL_MAP[h] || null);

      if (!fieldMap.includes('title')) {
        toast.error('Missing required column: "title"');
        return;
      }

      const parsed = rawRows
        .slice(1)
        .filter(r => r.some(c => c !== ''))
        .map((row, i) => {
          const obj = { _row: i + 2 };
          fieldMap.forEach((field, idx) => {
            if (field) {
              const val = row[idx];
              // Handle date objects from xlsx
              if (field === 'due_date' && val instanceof Date) {
                obj[field] = val.toISOString().split('T')[0];
              } else {
                obj[field] = String(val || '').trim();
              }
            }
          });
          return obj;
        });

      setFile(f);
      setRows(parsed);
      setRowErrors(validateRows(parsed, topics));
    } catch {
      toast.error('Failed to parse file. Please check the file format.');
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) parseFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  };

  const validRows = rows.filter((_, i) => (rowErrors[i]?.length ?? 0) === 0);
  const invalidCount = rows.filter((_, i) => (rowErrors[i]?.length ?? 0) > 0).length;

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: validRows.length });
    const failed = [];
    let succeeded = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const topicObj = row.topic
          ? topics.find(t => t.name.toLowerCase() === row.topic.toLowerCase())
          : null;

        const payload = {
          title: row.title,
          project: projectId,
          ...(row.description && { description: row.description }),
          ...(topicObj && { topic: topicObj.id }),
          priority: row.priority?.toLowerCase() || 'medium',
          status: row.status?.toLowerCase() || 'new',
          ...(row.due_date && { due_date: row.due_date }),
        };

        await tasksService.createTask(payload);
        succeeded++;
      } catch (err) {
        failed.push({
          row: row._row,
          title: row.title,
          error: err.response?.data
            ? Object.values(err.response.data).flat().join(', ')
            : 'Unknown error',
        });
      }
      setProgress({ done: i + 1, total: validRows.length });
    }

    setImporting(false);
    setResults({ succeeded, failed, skipped: invalidCount });

    if (succeeded > 0) {
      toast.success(`Imported ${succeeded} task(s) successfully`);
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['title', 'description', 'topic', 'priority', 'status', 'due_date'],
      ['Example Task 1', 'Task description here', '', 'high', 'new', '2026-03-20'],
      ['Example Task 2', '', '', 'medium', 'new', ''],
    ]);
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, 'task_import_template.xlsx');
  };

  const resetFile = () => {
    setFile(null);
    setRows([]);
    setRowErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Tasks</h2>
              <p className="text-sm text-gray-500">Import tasks from a CSV or Excel file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!results ? (
            <>
              {/* Template download */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div>
                  <p className="font-medium text-blue-900">Download Import Template</p>
                  <p className="text-sm text-blue-600">
                    Columns: <span className="font-mono">title</span>, <span className="font-mono">description</span>,{' '}
                    <span className="font-mono">topic</span>, <span className="font-mono">priority</span>,{' '}
                    <span className="font-mono">status</span>, <span className="font-mono">due_date</span>
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0 ml-4"
                >
                  <Download className="h-4 w-4" />
                  Template
                </button>
              </div>

              {/* Drop zone / file indicator */}
              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">Drop your file here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-3">Supports: .csv, .xlsx, .xls</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900 truncate">{file.name}</p>
                    <p className="text-sm text-green-700">
                      {rows.length} rows &middot;{' '}
                      <span className="text-green-600">{validRows.length} valid</span>
                      {invalidCount > 0 && (
                        <span className="text-red-500"> &middot; {invalidCount} with errors</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={resetFile}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Preview table */}
              {rows.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Preview</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-700 font-medium">{validRows.length} valid</span>
                      {invalidCount > 0 && (
                        <span className="text-red-600 font-medium">{invalidCount} errors</span>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium w-10">#</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Title</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Topic</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Priority</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Status</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Due Date</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Validation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 ${
                              (rowErrors[i]?.length ?? 0) > 0 ? 'bg-red-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-2 text-gray-400 text-xs">{row._row}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 max-w-[160px] truncate">
                              {row.title || <span className="text-red-500 italic">empty</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">
                              {row.topic || <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-3 py-2">
                              {row.priority ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  row.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  row.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  row.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{row.priority}</span>
                              ) : (
                                <span className="text-gray-400 text-xs">medium</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600 text-xs">{row.status || 'new'}</td>
                            <td className="px-3 py-2 text-gray-600 text-xs">{row.due_date || '-'}</td>
                            <td className="px-3 py-2">
                              {(rowErrors[i]?.length ?? 0) > 0 ? (
                                <div className="flex items-start gap-1">
                                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-red-600 text-xs">{rowErrors[i].join('; ')}</span>
                                </div>
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {importing && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="font-medium text-blue-900">
                      Importing... {progress.done}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results summary */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-700">{results.succeeded}</p>
                  <p className="text-sm text-green-600 mt-1">Imported</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-red-600">{results.failed.length}</p>
                  <p className="text-sm text-red-500 mt-1">Failed</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-yellow-600">{results.skipped}</p>
                  <p className="text-sm text-yellow-500 mt-1">Skipped</p>
                </div>
              </div>

              {results.failed.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                    <h3 className="font-semibold text-red-900">Failed Rows</h3>
                  </div>
                  <div className="divide-y divide-red-100 max-h-48 overflow-y-auto">
                    {results.failed.map((f, i) => (
                      <div key={i} className="px-4 py-3">
                        <p className="font-medium text-gray-900">Row {f.row}: {f.title}</p>
                        <p className="text-sm text-red-600 mt-0.5">{f.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 flex justify-between items-center gap-4">
          {!results ? (
            <>
              <p className="text-xs text-gray-400 hidden sm:block">
                Required: <code className="bg-gray-100 px-1 rounded">title</code>.
                Optional: description, topic, priority, status, due_date
              </p>
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : `Import ${validRows.length > 0 ? `${validRows.length} Tasks` : ''}`}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
