/*
 NETLIFY SPA FIX
 ----------------
 Crear un archivo llamado `_redirects` en la carpeta `public/` o `dist/` (según tu build)
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

// Estado inicial limpio y validado

const seedProducts = [
  { id: 'p1', name: 'Servicio Legal Básico', price: 2500 },
  { id: 'p2', name: 'Certificación PGR', price: 1500 },
  { id: 'p3', name: 'Gestión de Expediente', price: 2000 },
  { id: 'p4', name: 'Audiencia', price: 3500 },
  { id: 'p5', name: 'Redacción de Contrato', price: 4000 },
];

/* =====================
   Login / Registro
===================== */

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = e => {
    // Forzar rol admin para fortuna@hotmail.com

    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Debe completar todos los campos');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (isRegister) {
      if (users.find(u => u.email === email)) {
        setError('El usuario ya existe');
        return;
      }
      const newUser = { email, password, role: email === 'fortuna@hotmail.com' ? 'admin' : 'user' };
      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      onLogin({ email: newUser.email, role: newUser.role });
      localStorage.setItem('session', JSON.stringify({ email: newUser.email, role: newUser.role }));
      navigate('/', { replace: true });
      return;
    }

    const valid = users.find(u => u.email === email && u.password === password);
    // Forzar sesión admin si es fortuna@hotmail.com
    if (valid && valid.email === 'fortuna@hotmail.com') valid.role = 'admin';
    if (!valid) {
      alert('Credenciales incorrectas');
      return;
    }

    onLogin({ email: valid.email, role: valid.role });
    localStorage.setItem('session', JSON.stringify({ email: valid.email, role: valid.role }));
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form onSubmit={submit} className="bg-slate-800 p-6 rounded-xl w-80 grid gap-3">
        <h2 className="text-xl font-bold">fortuna-legal-app</h2>
        <input className="bg-slate-700 p-2 rounded" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="bg-slate-700 p-2 rounded" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-emerald-700 py-2 rounded">{isRegister ? 'Crear usuario' : 'Entrar'}</button>
        <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-sm text-emerald-400 underline">
          {isRegister ? 'Ya tengo cuenta' : 'Crear usuario'}
        </button>
      </form>
    </div>
  );
};

/* =====================
   Dashboard
===================== */

const Dashboard = ({ cases, onCreate, onDelete, onLogout }) => {
  const session = JSON.parse(localStorage.getItem('session'));
  const isAdmin = session?.role === 'admin';
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="bg-sky-700 px-4 py-2 rounded">Refrescar</button>
            <button onClick={() => setConfirmLogout(true)} className="bg-rose-700 px-4 py-2 rounded">Salir</button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Expedientes</h2>
            {JSON.parse(localStorage.getItem('session'))?.role === 'admin' && (
              <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-600 text-black">Administrador</span>
            )}
          </div>
          <button onClick={onCreate} className="bg-emerald-700 px-4 py-2 rounded">Nuevo</button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {cases.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded border border-slate-700">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-slate-400">Cliente: {c.client}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(`/cases/${c.id}`)} className="flex-1 bg-indigo-600 py-1 rounded">Abrir</button>
                {isAdmin && (
                  <button onClick={() => onDelete(c.id)} className="flex-1 bg-rose-600 py-1 rounded">Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {confirmLogout && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-slate-800 p-6 rounded-xl w-80 text-center">
              <h3 className="text-lg font-semibold mb-4">¿Cerrar sesión?</h3>
              <p className="text-sm text-slate-400 mb-6">Se cerrará tu sesión actual.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmLogout(false)} className="flex-1 bg-slate-600 py-2 rounded">Cancelar</button>
                <button onClick={onLogout} className="flex-1 bg-rose-700 py-2 rounded">Salir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================
   Case Details
===================== */

const CaseDetails = ({ cases, setCases, products }) => {
  const session = JSON.parse(localStorage.getItem('session'));
  const isAdmin = session?.role === 'admin';
  const { id } = useParams();
  const navigate = useNavigate();

  const index = cases.findIndex(c => c.id === id);
  const c = cases[index];

  if (!c) return <Navigate to="/" replace />;

  const { honorarios, totalProductos, totalGeneral } = useMemo(() => {
    const monto = Number(c.montoGanado) || 0;
    const honorariosCalc = (monto * HONORARIOS_PORCENTAJE) / 100;
    const productosCalc = c.products.reduce((s, p) => s + (p.customPrice ?? p.price) * p.qty, 0);
    return {
      honorarios: honorariosCalc,
      totalProductos: productosCalc,
      totalGeneral: honorariosCalc + productosCalc,
    };
  }, [c.montoGanado, c.products]);

  const update = changes => {
    setCases(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...changes };
      return copy;
    });
  };

  const addProduct = p => {
    if (c.products.find(x => x.id === p.id)) {
      alert('Este producto ya fue agregado.');
      return;
    }
    update({ products: [...c.products, { ...p, qty: 1, customPrice: p.price }] });
  };

  const updateQty = (pid, qty) => {
    update({ products: c.products.map(p => p.id === pid ? { ...p, qty: Math.max(1, qty) } : p) });
  };

  const updatePrice = (pid, price) => {
    update({ products: c.products.map(p => p.id === pid ? { ...p, customPrice: Math.max(0, price) } : p) });
  };

  const removeProduct = pid => {
    update({ products: c.products.filter(p => p.id !== pid) });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <button onClick={() => navigate('/')} className="text-emerald-400 underline mb-4">← Volver</button>

      <input disabled={!isAdmin} className="bg-slate-800 p-2 rounded w-full mb-3 disabled:opacity-50" value={c.title} onChange={e => update({ title: e.target.value })} />
      <input disabled={!isAdmin} className="bg-slate-800 p-2 rounded w-full mb-3 disabled:opacity-50" value={c.client} onChange={e => update({ client: e.target.value })} />

      <label>Monto ganado</label>
      <input disabled={!isAdmin} type="number" className="bg-slate-700 p-2 rounded mb-4 disabled:opacity-50" value={c.montoGanado} onChange={e => update({ montoGanado: Number(e.target.value) || 0 })} />

      <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-6">
        <div className="flex justify-between"><span>Honorarios (30%)</span><span>RD$ {formatMoney(honorarios)}</span></div>
        <div className="flex justify-between"><span>Total productos</span><span>RD$ {formatMoney(totalProductos)}</span></div>
        <div className="flex justify-between font-bold text-lg border-t border-slate-600 pt-2 mt-2"><span>TOTAL GENERAL</span><span>RD$ {formatMoney(totalGeneral)}</span></div>
      </div>

      <h3 className="font-semibold mt-4 mb-2">Productos del expediente</h3>
      {c.products.length === 0 && <p className="text-slate-400 text-sm mb-2">No hay productos agregados.</p>}

      {c.products.map(p => (
        <div key={p.id} className="flex items-center gap-2 bg-slate-800 p-2 rounded mb-2">
          <div className="flex-1">
            <strong>{p.name}</strong>
            <div className="text-sm text-slate-400">RD$ {formatMoney(p.customPrice)}</div>
          </div>
          <input disabled={!isAdmin} type="number" min="0" value={p.customPrice} onChange={e => updatePrice(p.id, Number(e.target.value))} className="w-24 bg-slate-700 p-1 rounded" />
          <input disabled={!isAdmin} type="number" min="1" value={p.qty} onChange={e => updateQty(p.id, Number(e.target.value))} className="w-16 bg-slate-700 p-1 rounded" />
          {isAdmin && (
          <button onClick={() => removeProduct(p.id)} className="bg-rose-700 px-2 py-1 rounded">✕</button>
        )}
        </div>
      ))}

      {isAdmin && (
      <>
      <h3 className="font-semibold mt-6 mb-2">Agregar producto</h3>
      {products.map(p => (
        <button key={p.id} onClick={() => addProduct(p)} className="block w-full text-left bg-slate-800 p-2 rounded mb-1">
          {p.name} — RD$ {formatMoney(p.price)}
        </button>
      ))}

      <div className="mt-4 bg-slate-800 p-3 rounded border border-slate-700">
        <h4 className="font-semibold mb-2">Producto personalizado</h4>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Nombre" className="bg-slate-700 p-2 rounded col-span-2" id="custom-name" />
          <input placeholder="Precio" type="number" className="bg-slate-700 p-2 rounded" id="custom-price" />
        </div>
        <button
          className="mt-2 bg-emerald-700 px-3 py-1 rounded"
          onClick={() => {
            const name = document.getElementById('custom-name').value;
            const price = Number(document.getElementById('custom-price').value);
            if (!name || price <= 0) return alert('Nombre y precio válidos');
            update({ products: [...c.products, { id: `custom-${Date.now()}`, name, price, customPrice: price, qty: 1 }] });
            document.getElementById('custom-name').value = '';
            document.getElementById('custom-price').value = '';
          }}
        >
          Agregar producto manual
        </button>
      </div>
      </>
      )}

      <button
        onClick={() => window.print()}
        className="mt-6 bg-indigo-700 px-4 py-2 rounded"
      >Imprimir / Guardar en PDF</button>
    </div>
  );
};

/* =====================
   App
===================== */

export default function App() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem('cases');
    return saved ? JSON.parse(saved) : seedCases;
  });
  const [products] = useState(seedProducts);

  useEffect(() => {
    // Seed admin fijo
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const hasAdmin = existingUsers.find(u => u.email === 'fortuna@hotmail.com');
    if (!hasAdmin) {
      localStorage.setItem('users', JSON.stringify([
        ...existingUsers,
        { email: 'fortuna@hotmail.com', password: 'karolayn', role: 'admin' }
      ]));
    }

    const savedUser = JSON.parse(localStorage.getItem('session'));
    if (savedUser && savedUser.email === 'fortuna@hotmail.com') {
      savedUser.role = 'admin';
      localStorage.setItem('session', JSON.stringify(savedUser));
    }
    if (savedUser && savedUser.email) setUser(savedUser);
  }, []);

  useEffect(() => {
    localStorage.setItem('cases', JSON.stringify(cases));
  }, [cases]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/" element={user ? (
          <Dashboard
            cases={cases}
            onCreate={() => setCases([...cases, { id: `c${Date.now()}`, title: 'Nuevo expediente', client: '', montoGanado: 0, products: [] }])}
            onDelete={id => setCases(cases.filter(c => c.id !== id))}
            onLogout={() => { localStorage.removeItem('session'); setUser(null); }}
          />
        ) : <Navigate to="/login" replace />} />
        <Route path="/cases/:id" element={user ? <CaseDetails cases={cases} setCases={setCases} products={products} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
