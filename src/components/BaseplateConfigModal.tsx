import React, { useMemo, useState } from 'react';
import * as THREE from 'three';

export type BaseplateType = 'rectangular' | 'convex-hull' | 'perforated-panel' | 'metal-wooden-plate';

interface BaseplateConfigModalProps {
  open: boolean;
  type: BaseplateType;
  modelBounds: { size: THREE.Vector3 } | null;
  onClose: () => void;
  onSubmit: (params: any) => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }>=({label, children})=> (
  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #e5e7eb' }}>
    <div style={{ color:'#0f172a', fontSize:13 }}>{label}</div>
    <div>{children}</div>
  </div>
);

const Num: React.FC<{ value:number; onChange:(v:number)=>void; suffix?:string; min?:number; step?:number }>=({value,onChange,suffix=' mm',min=0,step=0.1})=> (
  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
    <input type="number" value={value} min={min} step={step} onChange={e=>onChange(parseFloat(e.target.value))} style={{ width:100, padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}/>
    <span style={{ color:'#6b7280', fontSize:12 }}>{suffix}</span>
  </div>
);

const BaseplateConfigModal: React.FC<BaseplateConfigModalProps> = ({ open, type, modelBounds, onClose, onSubmit }) => {
  const footprint = useMemo(()=>{
    const sx = modelBounds?.size.x ?? 40;
    const sz = modelBounds?.size.z ?? 40;
    return { w:sx, d:sz };
  },[modelBounds]);

  const [fit, setFit] = useState<boolean>(type==='rectangular' || type==='metal-wooden-plate');
  const [width, setWidth] = useState<number>(Math.round(footprint.w + 10));
  const [depth, setDepth] = useState<number>(Math.round(footprint.d + 10));
  const [height, setHeight] = useState<number>(type==='perforated-panel'?10:5);
  const [oversizeXY, setOversizeXY] = useState<number>(10);

  const title = type === 'rectangular' ? 'Rectangular Baseplate'
    : type === 'convex-hull' ? 'Convex Hull Baseplate'
    : type === 'perforated-panel' ? 'Perforated Panel'
    : 'Custom Plate (Metal/Wooden)';

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.35)', display:'grid', placeItems:'center', zIndex:60 }}>
      <div style={{ width:420, background:'#fff', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.15)', padding:16 }}>
        <div style={{ fontSize:16, fontWeight:600, color:'#0f172a', marginBottom:8 }}>{title}</div>
        <div style={{ paddingTop:8 }}>
          { (type==='rectangular' || type==='metal-wooden-plate') && (
            <Row label="Fit size"><>
              <input type="checkbox" checked={fit} onChange={e=>setFit(e.target.checked)} />
            </></Row>
          )}

          { type!=='convex-hull' && (
            <>
              <Row label="Width"><Num value={width} onChange={setWidth}/></Row>
              <Row label="Depth"><Num value={depth} onChange={setDepth}/></Row>
            </>
          )}

          <Row label="Height"><Num value={height} onChange={setHeight}/></Row>

          { type==='convex-hull' && (
            <Row label="Oversize in XY"><Num value={oversizeXY} onChange={setOversizeXY}/></Row>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button onClick={onClose} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{
            const params:any = { height };
            if (type==='convex-hull') params.oversizeXY = oversizeXY;
            else {
              params.width = fit? Math.round(footprint.w + 10): width;
              params.depth = fit? Math.round(footprint.d + 10): depth;
              params.fit = fit;
            }
            onSubmit(params);
          }} style={{ padding:'8px 12px', borderRadius:8, border:'none', background:'#0ea5e9', color:'#fff', cursor:'pointer' }}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default BaseplateConfigModal;
