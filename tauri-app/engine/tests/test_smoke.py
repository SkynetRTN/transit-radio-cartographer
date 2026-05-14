"""Bootstrap-only smoke test.

Phase 0a's exit criterion is that `just test` runs and reports zero failures.
Real tests land in Phase 1 (codecs) onward; this file exists so pytest has
a discoverable test to collect and `pytest --collect-only` does not exit 5
(no-tests-collected) in CI.
"""

import radio_cartographer


def test_package_imports() -> None:
    assert radio_cartographer.__version__ == "0.0.0"
