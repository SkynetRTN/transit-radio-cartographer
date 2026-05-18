import { useState } from 'react';
import { rpcClient } from '../ipc/client';
export function PaletteEditor(){
  const [pts,setPts]=useState<number[]>([]); const [err,setErr]=useState('');
  const add=()=>{ if(pts.length>=100){setErr('Maximum 100 control points.'); return;} setPts([...pts,pts.length]); };
  return <div><button onClick={add}>Add Control Point</button><div>{pts.length}</div>{err&&<div>{err}</div>}<button onClick={()=>rpcClient.loadPalette('x.pal')}>Load Palette</button><button onClick={()=>rpcClient.savePalette(1,'x.pal')}>Save Palette</button></div>;
}
