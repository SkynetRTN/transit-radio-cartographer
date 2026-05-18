import { useState } from 'react';
import { rpcClient } from '../ipc/client';
export function SurveyView(){
  const [sel,setSel]=useState<{x0:number;x1:number}|null>(null);
  const h=1;
  return <div>
    <div data-testid='survey-plot' onMouseDown={()=>setSel({x0:1,x1:2})} onDoubleClick={()=>setSel(null)} onContextMenu={(e)=>{e.preventDefault();setSel(null);}}>{sel?'selected':''}</div>
    <button onClick={()=>rpcClient.smooth(h,3)}>Smooth</button>
    <button onClick={()=>rpcClient.baseline(h)}>Baseline</button>
    <button onClick={()=>rpcClient.align(h,0.5)}>Align</button>
    <button onClick={()=>rpcClient.makeImage(h,1)}>Make Image</button>
  </div>;
}
