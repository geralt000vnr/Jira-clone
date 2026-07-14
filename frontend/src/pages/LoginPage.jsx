import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KanbanSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { cn, fieldClass } from '../lib/utils';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-6">
          <div className="size-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
            <KanbanSquare className="size-6" />
          </div>
          <h1 className="text-lg font-semibold mt-3 text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Log in to continue to Jira Clone' : 'Set up your organization to get started'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3"
        >
          {mode === 'signup' && (
            <input
              placeholder="Organization name"
              value={form.orgName}
              onChange={update('orgName')}
              className={cn('w-full px-3 py-2 text-sm animate-slide-down', fieldClass)}
              required
            />
          )}
          {mode === 'signup' && (
            <input
              placeholder="Your name"
              value={form.name}
              onChange={update('name')}
              className={cn('w-full px-3 py-2 text-sm animate-slide-down', fieldClass)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={update('email')}
            className={cn('w-full px-3 py-2 text-sm', fieldClass)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={update('password')}
            className={cn('w-full px-3 py-2 text-sm', fieldClass)}
            required
          />

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 animate-slide-down">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-1">
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </Button>

          <p className="text-center text-xs text-slate-500 pt-1">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline underline-offset-2"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline underline-offset-2"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
