from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Generic, TypeVar

T = TypeVar("T")


class UnknownHandleError(KeyError):
    pass


@dataclass(frozen=True)
class HandleEntry(Generic[T]):
    handle: int
    value: T


class HandleRegistry:
    def __init__(self) -> None:
        self._items: dict[int, object] = {}
        self._next = 1
        self._lock = Lock()

    def create(self, value: object) -> int:
        with self._lock:
            handle = self._next
            self._next += 1
            self._items[handle] = value
            return handle

    def get(self, handle: int) -> object:
        try:
            return self._items[handle]
        except KeyError as exc:
            raise UnknownHandleError(handle) from exc

    def pop(self, handle: int) -> object:
        try:
            return self._items.pop(handle)
        except KeyError as exc:
            raise UnknownHandleError(handle) from exc

    def clear(self) -> None:
        self._items.clear()
