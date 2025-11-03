import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Smartphone, Tv, Refrigerator } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { APP_VERSION } from '../config/version';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastEmail');
    const savedPassword = localStorage.getItem('lastPassword');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Save credentials to localStorage on successful login
      localStorage.setItem('lastEmail', email);
      localStorage.setItem('lastPassword', password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@system.cz', password: 'admin123', role: 'Administrátor' },
    { email: 'dodavatel@acme.cz', password: 'admin123', role: 'Dodavatel' },
    { email: 'schvalovatel1@company.cz', password: 'admin123', role: 'Schvalovatel' },
    { email: 'uzivatel@email.cz', password: 'admin123', role: 'Koncový uživatel' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <Refrigerator className="w-8 h-8 text-white" strokeWidth={1.5} />
                <Tv className="w-8 h-8 text-white" strokeWidth={1.5} />
                <Smartphone className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-red-500 p-2 rounded-full shadow-md">
                <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Správa letáků</h1>
          <p className="text-gray-600 mt-2">Přihlaste se ke svému účtu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="E-mailová adresa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vas@email.cz"
            required
            autoComplete="email"
          />

          <Input
            type="password"
            label="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Zadejte své heslo"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Přihlásit se
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Testovací účty:</p>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="text-xs bg-gray-50 rounded-lg p-3 space-y-1"
              >
                <div className="font-medium text-gray-900">{account.role}</div>
                <div className="text-gray-600">
                  <span className="font-mono">{account.email}</span> / <span className="font-mono">{account.password}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-1">
          <p className="text-xs text-gray-400 mb-2">
            Verze {APP_VERSION}
          </p>
          <p className="text-xs text-gray-500">
            Designed by{' '}
            <a
              href="https://oresi.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Oresi
            </a>
          </p>
          <p className="text-xs text-gray-500">
            Developed by{' '}
            <a
              href="https://netmate.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              NetMate CZ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
