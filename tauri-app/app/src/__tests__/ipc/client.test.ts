import { RpcClient, RpcError, STALE_HANDLE_CODE, isStaleHandleError } from '../../ipc/client';
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
// BUG-012: RPC error responses surface as RpcError instances so consumers can
// branch on .code (e.g. STALE_HANDLE_CODE) instead of parsing the message.
test('error is RpcError with structured code', async ()=>{
  (invoke as any).mockResolvedValue({jsonrpc:'2.0', id:1, error:{code:1001,message:'unknown handle: 5',data:{handle:5}}});
  const c = new RpcClient();
  try {
    await c.request('x', {});
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).toBeInstanceOf(RpcError);
    expect(e).toBeInstanceOf(Error);
    const err = e as RpcError;
    expect(err.code).toBe(STALE_HANDLE_CODE);
    expect(err.code).toBe(1001);
    expect(err.message).toBe('1001:unknown handle: 5');
    expect(err.data).toEqual({handle:5});
    expect(isStaleHandleError(e)).toBe(true);
  }
});
test('isStaleHandleError ignores other codes and non-errors', async ()=>{
  expect(isStaleHandleError(new RpcError(1002, 'io fail'))).toBe(false);
  expect(isStaleHandleError(new Error('1001:unknown handle'))).toBe(false);
  expect(isStaleHandleError('1001:unknown handle')).toBe(false);
  expect(isStaleHandleError(null)).toBe(false);
});
