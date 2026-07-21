// @vitest-environment jsdom
/** Verifies the controlled/uncontrolled state machine: uncontrolled mode owns
 *  internal state and surfaces updates; controlled mode reads `props.start` /
 *  `props.duration` and skips internal state; mixed mode (one controlled, one
 *  uncontrolled) works independently per dimension. */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useControllableWindow } from './useControllableWindow.js';

describe('useControllableWindow', () => {
  it('uncontrolled mode owns state and emits onChange on update', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableWindow({
        start: undefined,
        duration: undefined,
        defaultDuration: 3600,
        onChange,
      }),
    );

    expect(result.current.isStartControlled).toBe(false);
    expect(result.current.isDurationControlled).toBe(false);
    expect(result.current.duration).toBe(3600);

    const newStart = new Date('2026-06-01T00:00:00Z');
    act(() => {
      result.current.setWindow({ start: newStart, duration: 7200 });
    });

    expect(result.current.start).toBe(newStart);
    expect(result.current.duration).toBe(7200);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: newStart, duration: 7200 });
  });

  it('controlled mode reads props.value and ignores internal state', () => {
    const onChange = vi.fn();
    const controlledStart = new Date('2026-07-01T12:00:00Z');
    const { result, rerender } = renderHook(
      ({ start, duration }: { start: Date; duration: number }) =>
        useControllableWindow({
          start,
          duration,
          defaultDuration: 3600,
          onChange,
        }),
      { initialProps: { start: controlledStart, duration: 21600 } },
    );

    expect(result.current.isStartControlled).toBe(true);
    expect(result.current.isDurationControlled).toBe(true);
    expect(result.current.start).toBe(controlledStart);
    expect(result.current.duration).toBe(21600);

    // setWindow should NOT mutate the controlled view — it just fires onChange.
    const newStart = new Date('2026-07-02T12:00:00Z');
    act(() => {
      result.current.setWindow({ start: newStart, duration: 43200 });
    });
    // Hook still returns the prop-provided values until the parent re-renders.
    expect(result.current.start).toBe(controlledStart);
    expect(result.current.duration).toBe(21600);
    expect(onChange).toHaveBeenCalledWith({ start: newStart, duration: 43200 });

    // Parent re-renders with the new values — now the view follows.
    rerender({ start: newStart, duration: 43200 });
    expect(result.current.start).toBe(newStart);
    expect(result.current.duration).toBe(43200);
  });

  it('mixed mode (controlled start, uncontrolled duration)', () => {
    const onChange = vi.fn();
    const controlledStart = new Date('2026-08-01T00:00:00Z');
    const { result } = renderHook(() =>
      useControllableWindow({
        start: controlledStart,
        duration: undefined,
        defaultDuration: 3600,
        onChange,
      }),
    );

    expect(result.current.isStartControlled).toBe(true);
    expect(result.current.isDurationControlled).toBe(false);
    expect(result.current.start).toBe(controlledStart);
    expect(result.current.duration).toBe(3600);

    const newStart = new Date('2026-08-02T00:00:00Z');
    act(() => {
      result.current.setWindow({ start: newStart, duration: 86_400 });
    });

    // start is controlled — view still reads the prop. duration is
    // uncontrolled — view follows the internal update.
    expect(result.current.start).toBe(controlledStart);
    expect(result.current.duration).toBe(86_400);
    expect(onChange).toHaveBeenCalledWith({ start: newStart, duration: 86_400 });
  });

  it('setWindow identity stays stable across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useControllableWindow({
        start: undefined,
        duration: undefined,
        defaultDuration: 3600,
      }),
    );
    const first = result.current.setWindow;
    rerender();
    expect(result.current.setWindow).toBe(first);
  });

  it('default start is captured once (does not drift between renders)', () => {
    const { result, rerender } = renderHook(() =>
      useControllableWindow({
        start: undefined,
        duration: undefined,
        defaultDuration: 3600,
      }),
    );
    const initialStart = result.current.start;
    rerender();
    expect(result.current.start).toBe(initialStart);
  });
});
