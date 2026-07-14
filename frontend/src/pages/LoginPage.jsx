import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">{mode === 'login' ? 'Log in' : 'Create your workspace'}</h1>

        {mode === 'signup' && (
          <input
            placeholder="Organization name"
            value={form.orgName}
            onChange={update('orgName')}
            className="w-full border rounded p-2 text-sm"
            required
          />
        )}
        {mode === 'signup' && (
          <input
            placeholder="Your name"
            value={form.name}
            onChange={update('name')}
            className="w-full border rounded p-2 text-sm"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={update('email')}
          className="w-full border rounded p-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={update('password')}
          className="w-full border rounded p-2 text-sm"
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button disabled={loading} className="w-full bg-indigo-600 text-white rounded p-2 text-sm font-medium">
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-indigo-600">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-indigo-600">
                Log in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
