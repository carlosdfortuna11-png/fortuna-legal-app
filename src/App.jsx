/*
 NETLIFY SPA FIX
 ----------------
 Crear un archivo llamado `_redirects` en la carpeta `public/` o `dist/`
 con el siguiente contenido:

 /*  /index.html  200

 Esto asegura que React Router funcione correctamente en Netlify
 al refrescar o acceder directamente a rutas como /cases/:id.
*/

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';

/* =====================
   Utilities
===================== */

const HONORARIOS_PORCENTAJE = 30;

const formatMoney = n =>
  (Number(n) || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* =====================
   Seed data
===================== */

const seedCases = [];

const generateCaseNumber = () => {
  const year = new Date().getFullYear();
  const counterKey = `case-counter-${year}`;
  const last = Number(localStorage.getItem(counterKey)) || 0;
  const next = last + 1;
  localStorage.setItem(counterKey, String(next));
  return `FMA-EXP-${year}-${String(next).padStart(4, '0')}`;
};

const seedProducts = [
  { id: 'p1', name: 'Servicio Legal Básico', price: 2500 },
  { id: 'p2', name: 'Certificación PGR', price: 1500 },
  { id: 'p3', name: 'Gestión de Expediente', price: 2000 },
  { id: 'p4', name: 'Audiencia', price: 3500 },
  { id: 'p5', name: 'Redacción de Contrato', price: 4000 },
];

/* =====================
   Login
===================== */

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const submit = e => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (isRegister) {
      if (users.find(u => u.email === email)) return alert('Usuario ya existe');
      const role = email === 'fortuna@hotmail.com' ? 'admin' : 'user';
      const newUser = { email, password, role };
      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      localStorage.setItem('session', JSON.stringify(newUser));
      onLogin(newUser);
      navigate('/');
      return;
    }

    const valid = users.find(u => u.email === email && u.password === password);
    if (!valid) return alert('Credenciales incorrectas');

    localStorage.setItem('session', JSON.stringify(valid));
    onLogin(valid);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form onSubmit={submit} className="bg-slate-800 p-6 rounded-xl w-80 grid gap-3">
        <h2 className="text-xl font-bold text-center">Fortuna Legal</h2>
        <input className="bg-slate-700 p-2 rounded" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="bg-slate-700 p-2 rounded" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-emerald-700 py-2 rounded">{isRegister ? 'Registrar' : 'Entrar'}</button>
        <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-sm text-emerald-400 underline">{isRegister ? 'Ya tengo cuenta' : 'Crear usuario'}</button>
      </form>
    </div>
  );
};

/* =====================
   Dashboard
===================== */

const Dashboard = ({ cases, onCreate, onDelete, onLogout }) => {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('session'));
  const isAdmin = session?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Expedientes</h2>
          <div className="flex gap-2">
            <button onClick={onCreate} className="bg-emerald-700 px-4 py-2 rounded">Nuevo</button>
            <button onClick={onLogout} className="bg-rose-700 px-4 py-2 rounded">Salir</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {cases.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm">{c.caseNumber}</p>
              <button onClick={() => navigate(`/cases/${c.id}`)} className="mt-2 bg-indigo-600 w-full rounded py-1">Abrir</button>
              {isAdmin && <button onClick={() => onDelete(c.id)} className="mt-1 bg-rose-600 w-full rounded py-1">Eliminar</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =====================
   Case Details
===================== */

const CaseDetails = ({ cases, setCases, products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const index = cases.findIndex(c => c.id === id);
  const c = cases[index];

  if (!c) return <Navigate to="/" />;

  const totals = useMemo(() => {
    const monto = Number(c.montoGanado) || 0;
    const honorarios = (monto * HONORARIOS_PORCENTAJE) / 100;
    const productos = c.products.reduce((s, p) => s + p.price * p.qty, 0);
    return {
      honorarios,
      productos,
      total: monto + honorarios + productos,
    };
  }, [c.montoGanado, c.products]);

  const update = changes => {
    const copy = [...cases];
    copy[index] = { ...copy[index], ...changes };
    setCases(copy);
  };

  const addProduct = prod => {
    const exists = c.products.find(p => p.id === prod.id);
    if (exists) {
      update({ products: c.products.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p) });
    } else {
      update({ products: [...c.products, { ...prod, qty: 1 }] });
    }
  };

  const updateQty = (pid, qty) => {
    update({ products: c.products.map(p => p.id === pid ? { ...p, qty: Math.max(1, qty) } : p) });
  };

  const removeProduct = pid => {
    update({ products: c.products.filter(p => p.id !== pid) });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <button onClick={() => navigate('/')} className="underline">← Volver</button>

      <h2 className="text-xl font-bold mt-4">{c.caseNumber}</h2>

      <input className="bg-slate-800 p-2 rounded w-full mt-2" value={c.title} onChange={e => update({ title: e.target.value })} />

      <input type="number" className="bg-slate-800 p-2 rounded w-full mt-2" value={c.montoGanado} onChange={e => update({ montoGanado: Number(e.target.value) })} placeholder="Monto ganado" />

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Agregar servicios / productos</h3>

        {/* Productos predefinidos */}
        <div className="grid md:grid-cols-2 gap-2 mb-4">
          {products.map(p => (
            <button key={p.id} onClick={() => addProduct(p)} className="bg-slate-700 p-2 rounded flex justify-between">
              <span>{p.name}</span>
              <span>RD$ {formatMoney(p.price)}</span>
            </button>
          ))}
        </div>

        {/* Producto manual */}
        <div className="bg-slate-800 p-3 rounded grid grid-cols-3 gap-2">
          <input
            placeholder="Nombre"
            className="bg-slate-700 p-2 rounded col-span-2"
            value={c.manualName || ''}
            onChange={e => update({ manualName: e.target.value })}
          />
          <input
            type="number"
            placeholder="Precio"
            className="bg-slate-700 p-2 rounded"
            value={c.manualPrice || ''}
            onChange={e => update({ manualPrice: Number(e.target.value) })}
          />
          <button
            onClick={() => {
              if (!c.manualName || !c.manualPrice) return;
              addProduct({ id: Date.now().toString(), name: c.manualName, price: c.manualPrice });
              update({ manualName: '', manualPrice: '' });
            }}
            className="col-span-3 bg-emerald-700 py-2 rounded"
          >
            Agregar producto manual
          </button>
        </div>
      </div>

      <div className="mt-6 bg-slate-800 p-3 rounded">
        <h3 className="font-semibold mb-2">Detalle del expediente</h3>
        {c.products.length === 0 && <p className="text-sm">Sin productos agregados</p>}
        {c.products.map(p => (
          <div key={p.id} className="flex items-center justify-between mb-2">
            <span>{p.name}</span>
            <div className="flex items-center gap-2">
              <input type="number" min="1" className="w-16 bg-slate-700 p-1 rounded" value={p.qty} onChange={e => updateQty(p.id, Number(e.target.value))} />
              <span>RD$ {formatMoney(p.price * p.qty)}</span>
              <button onClick={() => removeProduct(p.id)} className="text-rose-400">✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-slate-800 p-3 rounded">
        <div>Honorarios: RD$ {formatMoney(totals.honorarios)}</div>
        <div>Productos: RD$ {formatMoney(totals.productos)}</div>
        <div className="font-bold">TOTAL: RD$ {formatMoney(totals.total)}</div>
      </div>

      <button onClick={() => window.print()} className="mt-6 bg-indigo-700 px-4 py-2 rounded print:hidden">Imprimir / PDF</button>

      {/* Header solo para impresión */}
      <div className="hidden print:block print:mb-6 print:border-b print:pb-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Fortuna Mateo & Asociados" className="h-16" />
          <div>
            <h1 className="text-xl font-bold">Fortuna Mateo & Asociados</h1>
            <p className="text-sm">Expediente: {c.caseNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================
   App
===================== */

export default function App() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState(() => JSON.parse(localStorage.getItem('cases')) || seedCases);
  const [products] = useState(seedProducts);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.find(u => u.email === 'fortuna@hotmail.com')) {
      users.push({ email: 'fortuna@hotmail.com', password: 'karolayn', role: 'admin' });
      localStorage.setItem('users', JSON.stringify(users));
    }

    const session = JSON.parse(localStorage.getItem('session'));
    if (session) setUser(session);
  }, []);

  useEffect(() => {
    localStorage.setItem('cases', JSON.stringify(cases));
  }, [cases]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/" element={user ? <Dashboard cases={cases} onCreate={() => setCases([...cases, { id: Date.now().toString(), caseNumber: generateCaseNumber(), title: 'Nuevo expediente', montoGanado: 0, products: [] }])} onDelete={id => setCases(cases.filter(c => c.id !== id))} onLogout={() => { localStorage.removeItem('session'); setUser(null); }} /> : <Navigate to="/login" />} />
        <Route path="/cases/:id" element={user ? <CaseDetails cases={cases} setCases={setCases} products={products} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
