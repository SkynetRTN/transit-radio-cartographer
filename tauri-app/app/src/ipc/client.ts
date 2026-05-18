import { invoke } from "@tauri-apps/api/core";
export type HandleId = number; export type RpcError = { code:number; message:string; data?:unknown };
export class RpcClientError extends Error { constructor(public readonly rpc: RpcError){ super(rpc.message);} }
export class RpcClient { private id=0; async request<T>(method:string, params:Record<string,unknown>={}){ const response=await invoke<{result?:T;error?:RpcError}>("rpc_request",{payload:{jsonrpc:"2.0",id:++this.id,method,params}}); if(response.error) throw new RpcClientError(response.error); return response.result as T; }
openSurvey(path:string){return this.request("open_survey",{path});}
smooth(handle:HandleId){return this.request("smooth",{handle});}
baseline(handle:HandleId){return this.request("baseline",{handle});}
align(handle:HandleId, offset=0.5){return this.request("align",{handle,offset});}
makeImage(handle:HandleId,pixel_scale=1){return this.request("make_image",{handle,pixel_scale});}}
export const rpcClient=new RpcClient();
