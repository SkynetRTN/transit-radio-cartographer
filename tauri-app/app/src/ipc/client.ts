import { invoke } from '@tauri-apps/api/core';

export type RpcId = number;
export type RpcError = { code:number; message:string; data?:unknown };
export type RpcResponse<T> = { jsonrpc:'2.0'; id:RpcId; result?:T; error?:RpcError };
export type BinaryRef = { token:string; size:number };

export class RpcClient {
  private nextId = 1;
  constructor(private timeoutMs=5000) {}
  async request<T>(method:string, params:Record<string,unknown>={}) : Promise<T> {
    const id = this.nextId++;
    const p = invoke<RpcResponse<T>>('rpc_request',{ payload:{ jsonrpc:'2.0', id, method, params }});
    const timeout = new Promise<never>((_,rej)=>setTimeout(()=>rej(new Error('sidecar_timeout')), this.timeoutMs));
    const resp = await Promise.race([p, timeout]);
    if (resp.error) throw new Error(`${resp.error.code}:${resp.error.message}`);
    if (resp.result === undefined) throw new Error('missing_result');
    return resp.result;
  }
  openSurvey(path:string){ return this.request<{handle:number;metadata:{sweep_count:number;path:string}}>('open_survey',{path}); }
  smooth(handle:number, width:number){ return this.request('smooth',{handle,width}); }
  baseline(handle:number){ return this.request('baseline',{handle}); }
  align(handle:number, factor=0.5){ return this.request('align',{handle,factor}); }
  makeImage(handle:number, pix=1){ return this.request('make_image',{handle,pix}); }
  applyPalette(imageHandle:number, paletteHandle:number){ return this.request('apply_palette',{image_handle:imageHandle,palette_handle:paletteHandle}); }
  loadPalette(path:string){ return this.request('open_palette',{path}); }
  savePalette(handle:number,path:string){ return this.request('save_palette',{handle,path}); }
}

export const rpcClient = new RpcClient();
