import { fireEvent, render, screen } from '@testing-library/react';
import { SurveyView } from '../views/SurveyView';
import { rpcClient } from '../ipc/client';
vi.mock('../ipc/client',()=>({rpcClient:{smooth:vi.fn(), baseline:vi.fn(), align:vi.fn(), makeImage:vi.fn()}}));

test('workflow call order', ()=>{
  render(<SurveyView/>);
  fireEvent.click(screen.getByText('Smooth'));
  fireEvent.click(screen.getByText('Baseline'));
  fireEvent.click(screen.getByText('Align'));
  fireEvent.click(screen.getByText('Make Image'));
  expect((rpcClient.smooth as any).mock.invocationCallOrder[0]).toBeLessThan((rpcClient.baseline as any).mock.invocationCallOrder[0]);
  expect(rpcClient.align).toHaveBeenCalledWith(1,0.5);
  expect(rpcClient.makeImage).toHaveBeenCalledWith(1,1);
});
