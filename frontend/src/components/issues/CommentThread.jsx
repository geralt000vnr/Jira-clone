import { useState } from 'react';
import { Send, Pencil, Trash2 } from 'lucide-react';
import { commentApi } from '../../api/commentApi';
import { useAuth } from '../../context/AuthContext';
import { cn, fieldClass, getInitials } from '../../lib/utils';

export default function CommentThread({ issueId, comments, onChange }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const handlePost = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const comment = await commentApi.create(issueId, draft.trim());
      onChange([...comments, comment]);
      setDraft('');
    } finally {
      setPosting(false);
    }
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
        <div key={c._id} className="flex gap-2.5 animate-slide-up">
          <div className="size-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-medium flex items-center justify-center shrink-0 mt-0.5">
            {getInitials(c.authorId?.name)}
          </div>
          <div className="flex-1 border border-slate-100 rounded-lg p-3 text-sm bg-slate-50/50">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-800">{c.authorId?.name}</span>
              <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
            </div>

            {editingId === c._id ? (
              <div className="space-y-2">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className={cn('w-full px-2 py-1.5 text-sm', fieldClass)}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => saveEdit(c._id)} className="text-indigo-600 text-xs font-medium hover:underline">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 text-xs hover:underline">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-slate-700 whitespace-pre-wrap">{c.body}</p>
                {String(c.authorId?._id) === String(user.id) && (
                  <div className="flex gap-3 mt-1.5">
                    <button
                      onClick={() => startEdit(c)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors duration-150"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors duration-150"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-2 items-end pt-1">
        <div className="size-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-medium flex items-center justify-center shrink-0">
          {getInitials(user?.name)}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handlePost();
          }}
          placeholder="Add a comment... (⌘/Ctrl + Enter to post)"
          className={cn('flex-1 px-3 py-2 text-sm resize-none', fieldClass)}
          rows={2}
        />
        <button
          onClick={handlePost}
          disabled={posting || !draft.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 rounded-lg h-9 hover:bg-indigo-700 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send className="size-3.5" />
          Post
        </button>
      </div>
    </div>
  );
}
