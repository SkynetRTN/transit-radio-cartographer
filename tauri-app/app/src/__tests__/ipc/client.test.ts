import { RpcClient } from '../../ipc/client';
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn()}));
import { invoke } from '@tauri-apps/api/core';

test('happy path', async ()=>{
  (invoke as any).mockResolvedValue({jsonrpc:'2.0', id:1, result:{ok:true}});
  const c = new RpcClient();
  await expect(c.request('ping',{})).resolves.toEqual({ok:true});
});
test('error path', async ()=>{
  (invoke as any).mockResolvedValue({jsonrpc:'2.0', id:1, error:{code:100,message:'bad'}});
  const c = new RpcClient();
  await expect(c.request('x',{})).rejects.toThrow('100:bad');
});
test('timeout', async ()=>{
  (invoke as any).mockImplementation(()=>new Promise(()=>{}));
  const c = new RpcClient(5);
  await expect(c.request('x',{})).rejects.toThrow('sidecar_timeout');
});
