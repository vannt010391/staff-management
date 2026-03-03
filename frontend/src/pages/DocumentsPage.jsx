import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Trash2, ExternalLink, Download } from 'lucide-react';
import documentsService from '../services/documents';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    external_url: '',
    file: null,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsService.getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      external_url: '',
      file: null,
    });
    setSelectedDocument(null);
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setFormData({
      title: document.title || '',
      description: document.description || '',
      external_url: document.external_url || '',
      file: null,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter title');
      return;
    }
    if (!formData.external_url && !formData.file && !selectedDocument?.file_url) {
      toast.error('Please provide file or link');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        external_url: formData.external_url,
      };
      if (formData.file) payload.file = formData.file;

      if (selectedDocument) {
        await documentsService.updateDocument(selectedDocument.id, payload);
        toast.success('Document updated');
      } else {
        await documentsService.createDocument(payload);
        toast.success('Document created');
      }

      setShowForm(false);
      resetForm();
      await fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error(error.response?.data?.detail || 'Failed to save document');
    }
  };

  const handleDelete = async (document) => {
    if (!confirm(`Delete document "${document.title}"?`)) return;

    try {
      await documentsService.deleteDocument(document.id);
      toast.success('Document deleted');
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600">Manage files and external document links</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          New Document
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No documents yet</div>
        ) : (
          <div className="divide-y">
            {documents.map((document) => (
              <div key={document.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{document.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{document.description || '-'}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    By {document.uploaded_by_name || 'Unknown'} • {new Date(document.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  {document.file_url && (
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-indigo-100 rounded-lg"
                      title="Download file"
                    >
                      <Download className="h-4 w-4 text-indigo-600" />
                    </a>
                  )}
                  {document.external_url && (
                    <a
                      href={document.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-blue-100 rounded-lg"
                      title="Open link"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(document)}
                    className="p-2 hover:bg-green-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(document)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedDocument ? 'Edit Document' : 'New Document'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">External Link</label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, external_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setFormData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                {selectedDocument?.file_url && (
                  <div className="text-xs text-gray-500 mt-1">Leave empty to keep current file.</div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  {selectedDocument ? 'Update Document' : 'Create Document'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
