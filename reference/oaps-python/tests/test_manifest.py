from __future__ import annotations

import contextlib
import json
import io
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from oaps_python.cli import main
from oaps_python.manifest import MANIFEST_RELATIVE_PATH, inventory_repository, validate_repository


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

    def test_inventory_reports_scopes_and_scenarios(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = inventory_repository(repo_root=repo_root)
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_packs, 8)
        self.assertEqual(report.total_scenarios, 44)
        self.assertEqual(
            report.scopes,
            (
                "core",
                "binding:http",
                "profile:mcp",
                "profile:a2a",
                "profile:auth-web",
                "profile:auth-fides-tap",
                "profile:x402",
                "profile:osp",
            ),
        )

    def test_inventory_can_filter_by_scope(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = inventory_repository(repo_root=repo_root, requested_scopes=("profile:mcp", "profile:x402"))
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_packs, 2)
        self.assertEqual(report.total_scenarios, 8)
        self.assertEqual(report.scopes, ("profile:mcp", "profile:x402"))
        self.assertEqual(report.requested_scopes, ("profile:mcp", "profile:x402"))

    def test_inventory_reports_missing_requested_scope(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = inventory_repository(repo_root=repo_root, requested_scopes=("profile:does-not-exist",))
        self.assertFalse(report.ok)
        self.assertTrue(any("requested scope not found" in issue.message for issue in report.issues))

    def test_inventory_json_emits_schema_shaped_result(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            exit_code = main(["inventory", "--repo-root", str(repo_root), "--json"])
        self.assertEqual(exit_code, 0)
        payload = json.loads(stdout.getvalue())
        self.assertEqual(payload["result_schema_version"], "1.0")
        self.assertEqual(payload["manifest_id"], "oaps-tck")
        self.assertEqual(payload["summary"]["skip"], payload["summary"]["total"])
        self.assertEqual(payload["summary"]["pass"], 0)
        self.assertEqual(payload["summary"]["fail"], 0)
        self.assertEqual(payload["summary"]["error"], 0)
        self.assertEqual(len(payload["scenarios"]), 44)
        self.assertTrue(all(scenario["outcome"] == "skip" for scenario in payload["scenarios"]))
        self.assertEqual(payload["requested_scopes"], [])
        self.assertEqual(
            payload["scopes"],
            [
                "core",
                "binding:http",
                "profile:mcp",
                "profile:a2a",
                "profile:auth-web",
                "profile:auth-fides-tap",
                "profile:x402",
                "profile:osp",
            ],
        )

    def test_inventory_json_can_be_written_to_file(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "inventory.json"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "inventory",
                    "--repo-root",
                    str(repo_root),
                    "--json",
                    "--output",
                    str(output_path),
                    "--scope",
                    "profile:mcp",
                ])
            self.assertEqual(exit_code, 0)
            self.assertIn("Wrote inventory report", stdout.getvalue())
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["summary"]["total"], 5)
            self.assertEqual(payload["requested_scopes"], ["profile:mcp"])
            self.assertEqual(payload["scopes"], ["profile:mcp"])
            self.assertTrue(all(scenario["scope"] == "profile:mcp" for scenario in payload["scenarios"]))

    def test_inventory_text_mentions_scopes(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            exit_code = main(["inventory", "--repo-root", str(repo_root)])
        self.assertEqual(exit_code, 0)
        output = stdout.getvalue()
        self.assertIn("Inventory report", output)
        self.assertIn(
            "core, binding:http, profile:mcp, profile:a2a, profile:auth-web, profile:auth-fides-tap, profile:x402, profile:osp",
            output,
        )
        self.assertIn("inventory-only report", output)

    def test_inventory_text_mentions_requested_scopes_and_writes_file(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "inventory.txt"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "inventory",
                    "--repo-root",
                    str(repo_root),
                    "--output",
                    str(output_path),
                    "--scope",
                    "profile:osp",
                ])
            self.assertEqual(exit_code, 0)
            self.assertIn("Wrote inventory report", stdout.getvalue())
            written = output_path.read_text(encoding="utf-8")
            self.assertIn("requested scopes: profile:osp", written)
            self.assertIn("scopes: profile:osp", written)
            self.assertIn("inventory-only report", written)


if __name__ == "__main__":
    unittest.main()
