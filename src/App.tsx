import { useMemo, useState } from 'react';

type Layer = { from: string; to: string; lithology: string; redox: string; color: string; cement: string; cps: string; samples: string; extras: Record<string, string>; collapsed?: boolean };
type Trench = { id: string; name: string; elevation: string; easting: string; northing: string; layers: string; project: string };

const lithologies = ['Arcilla', 'Limo', 'Arena fina', 'Arena media', 'Arena gruesa', 'Grava', 'Arenisca', 'Calcreta', 'Yeso'];
const redoxes = ['Oxidado', 'Reducido', 'Transición', 'Indeterminado'];
const colors = ['Marrón claro', 'Marrón oscuro', 'Gris', 'Verde', 'Amarillo', 'Rojizo'];

const emptyLayer = (): Layer => ({ from: '', to: '', lithology: lithologies[0], redox: redoxes[3], color: colors[0], cement: '', cps: '', samples: '', extras: {}, collapsed: false });
const load = (): Trench[] => JSON.parse(localStorage.getItem('trenches') ?? '[]');
const save = (d: Trench[]) => localStorage.setItem('trenches', JSON.stringify(d));

function profileSvg(tr: Trench) {
  const layers: Layer[] = JSON.parse(tr.layers || '[]');
  const maxDepth = Math.max(...layers.map((l) => Number(l.to) || 0), 10);
  const scale = 380 / maxDepth;
  return <svg viewBox="0 0 850 560" className="w-full rounded border border-amber-700 bg-[#fdf8f0] font-mono text-[10px]">
    <defs>
      <pattern id="sand" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#8b5e34"/></pattern>
      <pattern id="clay" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,4 L8,4" stroke="#7b4f2e" strokeWidth="1"/></pattern>
      <pattern id="gravel" width="12" height="12" patternUnits="userSpaceOnUse"><ellipse cx="4" cy="4" rx="2.5" ry="1.6" fill="#7b4f2e"/></pattern>
    </defs>
    <rect x="0" y="0" width="850" height="560" fill="#fdf8f0" />
    <text x="20" y="24">ID: {tr.name} | Elev: {tr.elevation} m | E {tr.easting} N {tr.northing}</text>
    <g transform="translate(50,60)"><line x1="0" y1="0" x2="0" y2="400" stroke="#6b4d37"/>{Array.from({ length: Math.ceil(maxDepth) + 1 }).map((_, i) => <g key={i}><line x1="-5" y1={i*scale} x2="0" y2={i*scale} stroke="#6b4d37"/><text x="-30" y={i*scale+4}>{i}</text></g>)}</g>
    {layers.map((l, i) => { const y = 60 + (Number(l.from)||0) * scale; const h = ((Number(l.to)||0) - (Number(l.from)||0))*scale; const fill = l.lithology.includes('Arena') ? 'url(#sand)' : l.lithology.includes('Arcilla') || l.lithology.includes('Limo') ? 'url(#clay)' : l.lithology.includes('Grava') ? 'url(#gravel)' : '#e9d5b5'; const rx = l.redox==='Oxidado'?'#f59e0b':l.redox==='Reducido'?'#22c55e':l.redox==='Transición'?'#f97316':'#9ca3af'; const cps=Number(l.cps)||0;
      return <g key={i}><rect x="90" y={y} width="170" height={h} fill={fill} stroke="#6b4d37"/><rect x="270" y={y} width="20" height={h} fill={rx} stroke="#6b4d37"/><rect x="300" y={y+2} width={Math.min(cps/5,180)} height={Math.max(h-4,2)} fill="#a16207" opacity="0.6"/><text x="95" y={y+12}>{l.lithology}</text><text x="490" y={y+12}>{l.samples}</text></g>;})}
    <text x="90" y="485">Leyenda: patrones litológicos | redox lateral | barras CPS</text>
  </svg>;
}

export function App() {
  const [tab, setTab] = useState<'perfiles'|'transecta'|'mapa'>('perfiles');
  const [trenches, setTrenches] = useState<Trench[]>(load());
  const [editing, setEditing] = useState<Trench | null>(null);
  const [f, setF] = useState({ name: '', elevation: '', easting: '', northing: '', project: '' });
  const [layers, setLayers] = useState<Layer[]>([emptyLayer()]);

  const preview = useMemo(() => ({ id: editing?.id || crypto.randomUUID(), ...f, layers: JSON.stringify(layers), project: f.project }), [f, layers, editing]);
  const persist = () => { if (!f.name.trim()) return; const t: Trench = { id: editing?.id || crypto.randomUUID(), ...f, layers: JSON.stringify(layers), project: f.project }; const next = editing ? trenches.map((x) => x.id===editing.id ? t : x) : [t, ...trenches]; setTrenches(next); save(next); setEditing(null); };
  const edit = (t: Trench) => { setEditing(t); setF({ name:t.name,elevation:t.elevation,easting:t.easting,northing:t.northing,project:t.project }); setLayers(JSON.parse(t.layers||'[]')); setTab('perfiles'); };

  return <div className="min-h-screen bg-field font-sans">
    <header className="sticky top-0 z-20 border-b border-amber-800 bg-field/95 p-4"><h1 className="text-xl font-bold">ISR Uranium Fieldbook</h1></header>
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-3 flex gap-2">{['perfiles','transecta','mapa'].map((t)=><button key={t} onClick={()=>setTab(t as any)} className={`rounded px-3 py-2 ${tab===t?'bg-amber-700 text-white':'bg-amber-100'}`}>{t.toUpperCase()}</button>)}</div>
      {tab==='perfiles' && <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded border border-amber-800 bg-amber-50 p-3">{(['name','elevation','easting','northing','project'] as const).map((k)=><input key={k} className="w-full rounded border p-2 font-mono" placeholder={k} value={f[k]} onChange={(e)=>setF({...f,[k]:e.target.value})}/>)}
        <div className="space-y-2">{layers.map((l,i)=><details key={i} open={!l.collapsed} className="rounded border p-2"><summary>Capa {i+1}: {l.from}-{l.to}m</summary><div className="grid grid-cols-2 gap-2 pt-2">{(['from','to','cement','cps','samples'] as const).map((k)=><input key={k} className="rounded border p-1 font-mono" placeholder={k} value={l[k]} onChange={(e)=>{const n=[...layers]; (n[i] as any)[k]=e.target.value; setLayers(n);}}/>)}<select value={l.lithology} onChange={(e)=>{const n=[...layers]; n[i].lithology=e.target.value; setLayers(n);}}>{lithologies.map(v=><option key={v}>{v}</option>)}</select><select value={l.redox} onChange={(e)=>{const n=[...layers]; n[i].redox=e.target.value; setLayers(n);}}>{redoxes.map(v=><option key={v}>{v}</option>)}</select><select value={l.color} onChange={(e)=>{const n=[...layers]; n[i].color=e.target.value; setLayers(n);}}>{colors.map(v=><option key={v}>{v}</option>)}</select><input className="rounded border p-1" placeholder="extra key=value" onBlur={(e)=>{const [k,v]=e.target.value.split('='); if(k&&v){const n=[...layers];n[i].extras[k.trim()]=v.trim(); setLayers(n); e.target.value='';}}}/></div></details>)}</div>
        <div className="flex gap-2"><button className="rounded bg-amber-700 px-3 py-2 text-white" onClick={()=>setLayers([...layers, emptyLayer()])}>Agregar capa</button><button className="rounded bg-amber-900 px-3 py-2 text-white" onClick={persist}>Guardar Calicata</button></div>
        </div>
        <div>{profileSvg(preview as Trench)}</div>
      </div>}
      {tab==='transecta' && <div className="space-y-3"><div className="rounded border p-3">{trenches.map((t)=><div key={t.id} className="cursor-pointer border-b py-1 font-mono" onDoubleClick={()=>edit(t)}>{t.name} | E:{t.easting} N:{t.northing}</div>)}</div>
      <div className="overflow-auto rounded border bg-amber-50 p-3"><svg viewBox={`0 0 ${Math.max(900, trenches.length*170)} 500`} className="w-full font-mono text-[10px]"><polyline fill="none" stroke="#92400e" points={trenches.map((t,i)=>`${70+i*160},${80-(Number(t.elevation)||0)/10+100}`).join(' ')}/>{trenches.map((t,i)=><g key={t.id} transform={`translate(${40+i*160},120)`}><rect width="90" height="260" fill="#fef3c7" stroke="#78350f"/><text x="0" y="-8">{t.name}</text>{JSON.parse(t.layers||'[]').map((l:Layer,j:number)=>{const y=(Number(l.from)||0)*12; const h=((Number(l.to)||0)-(Number(l.from)||0))*12; return <g key={j}><rect x="0" y={y} width="70" height={h} fill="#e7c6a5" stroke="#78350f"/><rect x="72" y={y} width="10" height={h} fill={l.redox==='Oxidado'?'#f59e0b':'#22c55e'}/></g>;})}</g>)}</svg></div></div>}
      {tab==='mapa' && <div className="grid gap-3 lg:grid-cols-2"><svg viewBox="0 0 600 420" className="rounded border bg-amber-50 p-2">{Array.from({length:10}).map((_,i)=><line key={i} x1={40+i*50} y1={20} x2={40+i*50} y2={390} stroke="#e5c59b"/>) }{trenches.map((t)=>{const x=Number(t.easting)||0; const y=Number(t.northing)||0; const px=60+(x%500); const py=360-(y%320); return <g key={t.id} onDoubleClick={()=>edit(t)} className="cursor-pointer"><circle cx={px} cy={py} r="6" fill="#b45309"/><text x={px+8} y={py-8} fontSize="10">{t.name} ({t.elevation}m)</text></g>;})}</svg>
      <div className="space-y-2">{trenches.map((t)=><div key={t.id} onDoubleClick={()=>edit(t)} className="rounded border bg-amber-100 p-2"><div className="font-semibold">{t.name}</div><div className="text-xs font-mono">E {t.easting} | N {t.northing} | Elev {t.elevation}</div></div>)}</div></div>}
    </div>
  </div>;
}
