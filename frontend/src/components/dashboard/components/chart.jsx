// import { RechartsDevtools } from '@recharts/devtools';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import useProspectWebSocket from '../../../hooks/useProspectWebSocket';
import { MESES, MODOS } from '../../../data/time';

const filtrarYAgrupar = (prospects, modo) => {
  const ahora = new Date();
  const mapa = {};

  // Filtra por rango si aplica
  let filtrados = [...prospects];

  if (modo === '7dias') {
    const limite = new Date(ahora);
    limite.setDate(ahora.getDate() - 7);
    filtrados = prospects.filter(p => new Date(p.created_at) >= limite);
  }

  if (modo === '30dias') {
    const limite = new Date(ahora);
    limite.setDate(ahora.getDate() - 30);
    filtrados = prospects.filter(p => new Date(p.created_at) >= limite);
  }

  // Agrupa por la key correspondiente
  filtrados
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach(p => {
      const fecha = new Date(p.created_at);
      let key;

      if (modo === 'horas')          key = `${fecha.toLocaleDateString('es-BO')} ${fecha.getHours()}:00`;
      if (modo === '7dias')          key = fecha.toLocaleDateString('es-BO');
      if (modo === '30dias')         key = fecha.toLocaleDateString('es-BO');
      if (modo === 'dia')            key = fecha.toLocaleDateString('es-BO');
      if (modo === 'mes')            key = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
      if (modo === 'año')            key = `${fecha.getFullYear()}`;

      if (!mapa[key]) mapa[key] = { hora: key, total: 0, registrados: 0 };

      mapa[key].total += 1;

      const tieneDatos = p.first_name !== "" && p.last_name !== "" && p.phone !== "";
      if (tieneDatos) mapa[key].registrados += 1;
    });

  return Object.values(mapa);
};

export default function Chart({userCode}) {
  const {prospects} = useProspectWebSocket(userCode);
  const [chartData, setChartData] = useState([]);
  const [modo, setModo] = useState('horas'); // 'dia' | 'mes' | 'año'

  useEffect(() => {
    if (!prospects || prospects.length === 0) return;
    setChartData(filtrarYAgrupar(prospects, modo));
  }, [prospects, modo]);

  return (
    <>
     <div className="mb-3 d-flex align-items-center flex-wrap gap-2">
        {MODOS.map(m => (
          <button
            key={m.key}
            onClick={() => setModo(m.key)}
            className={`btn btn-sm ${modo === m.key ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" tick={{ fontSize: 11 }}/>
            <YAxis/>
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey="total" stroke="#8884d8" name="Total prospectos" strokeWidth={2} />
            <Line type='monotone' dataKey="registrados" stroke="#82ca9d" name="Prospectos Registrados" strokeWidth={2}/>
          </LineChart>
      </ResponsiveContainer>
    </>
  );
}