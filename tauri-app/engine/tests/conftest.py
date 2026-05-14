"""Shared pytest fixtures for the engine test suite."""

from __future__ import annotations

from pathlib import Path

import pytest

FIXTURES = Path(__file__).resolve().parents[3] / "fixtures"


@pytest.fixture(scope="session")
def fixtures_dir() -> Path:
    """Absolute path to `fixtures/` at the repo root."""
    return FIXTURES


@pytest.fixture(scope="session")
def inputs_dir(fixtures_dir: Path) -> Path:
    return fixtures_dir / "inputs"


@pytest.fixture(scope="session")
def intermediates_dir(fixtures_dir: Path) -> Path:
    return fixtures_dir / "intermediates"


@pytest.fixture(scope="session")
def outputs_dir(fixtures_dir: Path) -> Path:
    return fixtures_dir / "outputs"
