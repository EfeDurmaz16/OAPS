from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from oaps_python.manifest import MANIFEST_RELATIVE_PATH, validate_repository


class ManifestValidationTests(unittest.TestCase):
    def test_repository_manifest_validates(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = validate_repository(repo_root=repo_root)
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.manifest_path, repo_root / MANIFEST_RELATIVE_PATH)

    def test_missing_reference_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            (repo_root / "conformance/manifest").mkdir(parents=True)
            (repo_root / "conformance/taxonomy").mkdir(parents=True)
            (repo_root / "conformance/fixtures").mkdir(parents=True)
            (repo_root / "spec/core").mkdir(parents=True)
            (repo_root / "spec/bindings").mkdir(parents=True)
            (repo_root / "profiles").mkdir(parents=True)
            (repo_root / "reference/oaps-monorepo/packages/core/src").mkdir(parents=True)

            manifest = {
                "manifest_version": "1.0",
                "tck_id": "oaps-tck",
                "suite_version": "foundation-draft",
                "status": "draft",
                "entrypoints": [{"scope": "core", "pack": "conformance/fixtures/core/index.v1.json"}],
                "taxonomy": "conformance/taxonomy/scenario-taxonomy.v1.json",
                "fixture_index": "conformance/fixtures/index.v1.json",
                "runner_contract": "conformance/runner-contract.md",
                "result_schema": "conformance/results/result-schema.v1.json",
                "normative_sources": ["spec/core/FOUNDATION-DRAFT.md"],
                "reference_implementations": ["reference/oaps-monorepo/packages/core/src/index.ts"],
            }
            (repo_root / MANIFEST_RELATIVE_PATH).write_text(json.dumps(manifest), encoding="utf-8")
            (repo_root / "conformance/taxonomy/scenario-taxonomy.v1.json").write_text("{}", encoding="utf-8")
            (repo_root / "conformance/fixtures/index.v1.json").write_text(
                json.dumps({"index_version": "1.0", "packs": []}),
                encoding="utf-8",
            )
            (repo_root / "spec/core/FOUNDATION-DRAFT.md").write_text("# draft", encoding="utf-8")

            report = validate_repository(repo_root=repo_root)
            self.assertFalse(report.ok)
            self.assertTrue(any("missing referenced file" in issue.message for issue in report.issues))


if __name__ == "__main__":
    unittest.main()
