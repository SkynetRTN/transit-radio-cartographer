"""Frozen-binary entrypoint.

PyInstaller freezes the script it's given as `__main__`, which breaks
relative imports inside `radio_cartographer.rpc`. This wrapper invokes
`serve()` from the proper package context so the relative imports
resolve at runtime.
"""

from radio_cartographer.rpc import serve

if __name__ == "__main__":
    raise SystemExit(serve())
