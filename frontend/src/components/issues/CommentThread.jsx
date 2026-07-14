import { useState } from 'react';
import { commentApi } from '../../api/commentApi';
import { useAuth } from '../../context/AuthContext';

export default function CommentThread({ issueId, comments, onChange }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const handlePost = async () => {
    if (!draft.trim()) return;
    const comment = await commentApi.create(issueId, draft.trim());
    onChange([...comments, comment]);
    setDraft('');
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setEditDraft(c.body);
  };

  const saveEdit = async (id) => {
    const updated = await commentApi.update(id, editDraft.trim());
    onChange(comments.map((c) => (c._id === id ? updated : c)));
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    await commentApi.remove(id);
    onChange(comments.filter((c) => c._id !== id));
  };

  return (
    <div className="mt-4 space-y-3">
      {comments.map((c) => (
        <div key={c._id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">{c.authorId?.name}</span>
            <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
          </div>

          {editingId === c._id ? (
            <div className="space-y-2">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(c._id)} className="text-indigo-600 text-xs">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="text-slate-400 text-xs">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-700 whitespace-pre-wrap">{c.body}</p>
              {String(c.authorId?._id) === String(user.id) && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => startEdit(c)} className="text-xs text-slate-500 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c._id)} className="text-xs text-red-500 hover:underline">
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border rounded p-2 text-sm"
          rows={2}
        />
        <button onClick={handlePost} className="bg-indigo-600 text-white text-sm px-3 rounded self-end h-9">
          Post
        </button>
      </div>
    </div>
  );
}
