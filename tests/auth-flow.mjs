import { signInWithFallback, signUpWithFallback, getCurrentUser } from '../js/supabase.js';

const store = new Map();

const fakeStorage = {
  getItem(key) {
    return store.has(key) ? JSON.stringify(store.get(key)) : null;
  },
  setItem(key, value) {
    store.set(key, JSON.parse(value));
  },
  removeItem(key) {
    store.delete(key);
  }
};

globalThis.localStorage = fakeStorage;

const demoLogin = signInWithFallback({ email: 'ana@vidapf.com', password: 'demo123' });
if (!demoLogin.success) throw new Error('Demo login failed');

const newUser = signUpWithFallback({ name: 'Beatriz', email: 'beatriz@teste.com', password: '123456' });
if (!newUser.success) throw new Error('Signup failed');

const validLogin = signInWithFallback({ email: 'beatriz@teste.com', password: '123456' });
if (!validLogin.success) throw new Error('Valid login failed');

const invalidLogin = signInWithFallback({ email: 'beatriz@teste.com', password: 'senhaerrada' });
if (invalidLogin.success) throw new Error('Invalid login unexpectedly succeeded');

const sessionUser = getCurrentUser();
if (!sessionUser || sessionUser.email !== 'beatriz@teste.com') {
  throw new Error('Current session not set correctly');
}

console.log('AUTH_FLOW_OK', demoLogin.user.email, validLogin.user.email, sessionUser.email);
