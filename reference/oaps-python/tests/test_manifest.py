from __future__ import annotations

import contextlib
import json
import io
import tempfile
import unittest
from pathlib import Path
import sys


def _fixture_count(repo_root: Path, *scopes: str) -> int:
    fixture_index = json.loads((repo_root / "conformance/fixtures/index.v1.json").read_text(encoding="utf-8"))
    wanted = set(scopes)
    total = 0
    for pack in fixture_index.get("packs", []):
        scope = pack["scope"]
        if wanted and scope not in wanted:
            continue
        pack_json = json.loads((repo_root / pack["path"]).read_text(encoding="utf-8"))
        total += len(pack_json.get("fixtures", []))
    return total


def _all_scopes() -> tuple[str, ...]:
    fixture_index = json.loads(
        (Path(__file__).resolve().parents[3] / "conformance/fixtures/index.v1.json").read_text(encoding="utf-8")
    )
    return tuple(pack["scope"] for pack in fixture_index.get("packs", []))



sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from oaps_python.cli import main
from oaps_python.manifest import (
    MANIFEST_RELATIVE_PATH,
    build_compatibility_declaration,
    fixture_check_repository,
    inventory_repository,
    validate_result_file,
    validate_repository,
)


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
        self.assertEqual(report.total_packs, len(_all_scopes()))
        self.assertEqual(report.total_scenarios, _fixture_count(repo_root))
        self.assertEqual(report.scopes, _all_scopes())

    def test_inventory_can_filter_by_scope(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = inventory_repository(repo_root=repo_root, requested_scopes=("profile:mcp", "profile:x402"))
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_packs, 2)
        self.assertEqual(report.total_scenarios, _fixture_count(repo_root, "profile:mcp", "profile:x402"))
        self.assertEqual(report.scopes, ("profile:mcp", "profile:x402"))
        self.assertEqual(report.requested_scopes, ("profile:mcp", "profile:x402"))

    def test_inventory_can_filter_grpc_scope(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = inventory_repository(repo_root=repo_root, requested_scopes=("binding:grpc",))
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_packs, 1)
        self.assertEqual(report.total_scenarios, _fixture_count(repo_root, "binding:grpc"))
        self.assertEqual(report.scopes, ("binding:grpc",))

    def test_inventory_can_filter_events_scope(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = inventory_repository(repo_root=repo_root, requested_scopes=("binding:events",))
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_packs, 1)
        self.assertEqual(report.total_scenarios, _fixture_count(repo_root, "binding:events"))
        self.assertEqual(report.scopes, ("binding:events",))

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
        self.assertEqual(len(payload["scenarios"]), _fixture_count(repo_root))
        self.assertTrue(all(scenario["outcome"] == "skip" for scenario in payload["scenarios"]))
        self.assertEqual(payload["requested_scopes"], [])
        self.assertEqual(payload["scopes"], list(_all_scopes()))

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
            self.assertEqual(payload["summary"]["total"], _fixture_count(repo_root, "profile:mcp"))
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
            ", ".join(_all_scopes()),
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

    def test_fixture_check_reports_static_passes(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = fixture_check_repository(repo_root=repo_root)
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_scenarios, _fixture_count(repo_root))
        self.assertEqual(report.total_pass, _fixture_count(repo_root))
        self.assertEqual(report.total_fail, 0)
        self.assertEqual(report.scopes, _all_scopes())

    def test_fixture_check_can_filter_scopes_and_scenarios(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        report = fixture_check_repository(
            repo_root=repo_root,
            requested_scopes=("profile:mcp",),
            requested_scenarios=("mcp.intent.execution",),
        )
        self.assertTrue(report.ok, report.to_dict())
        self.assertEqual(report.total_scenarios, 1)
        self.assertEqual(report.total_pass, 1)
        self.assertEqual(report.scopes, ("profile:mcp",))
        self.assertEqual(report.requested_scopes, ("profile:mcp",))
        self.assertEqual(report.requested_scenarios, ("mcp.intent.execution",))

    def test_fixture_check_reports_missing_reference(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            (repo_root / "conformance/manifest").mkdir(parents=True)
            (repo_root / "conformance/taxonomy").mkdir(parents=True)
            (repo_root / "conformance/fixtures/core").mkdir(parents=True)
            (repo_root / "conformance/results").mkdir(parents=True)
            (repo_root / "spec/core").mkdir(parents=True)
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
            (repo_root / "conformance/taxonomy/scenario-taxonomy.v1.json").write_text(
                json.dumps({"taxonomy_version": "1.0", "families": [{"id": "core", "dimensions": ["intent"]}], "coverage_levels": ["schema", "fixture", "reference-runtime", "cross-implementation"]}),
                encoding="utf-8",
            )
            (repo_root / "conformance/fixtures/index.v1.json").write_text(
                json.dumps({"index_version": "1.0", "packs": [{"scope": "core", "path": "conformance/fixtures/core/index.v1.json"}]}),
                encoding="utf-8",
            )
            (repo_root / "conformance/fixtures/core/index.v1.json").write_text(
                json.dumps(
                    {
                        "pack_version": "1.0",
                        "scope": "core",
                        "status": "active",
                        "normative_sources": ["spec/core/FOUNDATION-DRAFT.md"],
                        "fixtures": [
                            {
                                "scenario_id": "core.intent.basic",
                                "dimension": "intent",
                                "schema": "spec/core/FOUNDATION-DRAFT.md",
                                "example": "examples/does-not-exist.json",
                                "reference_test": "reference/oaps-monorepo/packages/core/src/index.ts",
                                "coverage": ["schema", "fixture", "reference-runtime"],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            (repo_root / "spec/core/FOUNDATION-DRAFT.md").write_text("# draft", encoding="utf-8")
            (repo_root / "conformance/results/result-schema.v1.json").write_text("{}", encoding="utf-8")
            (repo_root / "conformance/runner-contract.md").write_text("# contract", encoding="utf-8")
            (repo_root / "reference/oaps-monorepo/packages/core/src/index.ts").write_text("export {};\n", encoding="utf-8")

            report = fixture_check_repository(repo_root=repo_root)
            self.assertFalse(report.ok)
            self.assertEqual(report.total_fail, 1)
            self.assertTrue(any("missing referenced file" in issue.message for issue in report.issues))

    def test_fixture_check_json_emits_schema_shaped_result(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            exit_code = main(["check", "--repo-root", str(repo_root), "--json"])
        self.assertEqual(exit_code, 0)
        payload = json.loads(stdout.getvalue())
        self.assertEqual(payload["result_schema_version"], "1.0")
        self.assertEqual(payload["runner_id"], "oaps-python-fixture-check")
        self.assertEqual(payload["summary"]["pass"], _fixture_count(repo_root))
        self.assertEqual(payload["summary"]["fail"], 0)
        self.assertEqual(payload["summary"]["total"], _fixture_count(repo_root))
        self.assertNotIn("requested_scopes", payload)
        self.assertEqual(payload["implementation"]["metadata"]["requested_scopes"], [])
        self.assertEqual(payload["implementation"]["metadata"]["requested_scenarios"], [])

    def test_fixture_check_json_can_be_written_to_file(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "fixture-check.json"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "check",
                    "--repo-root",
                    str(repo_root),
                    "--json",
                    "--scope",
                    "profile:mcp",
                    "--scenario",
                    "mcp.intent.execution",
                    "--output",
                    str(output_path),
                ])
            self.assertEqual(exit_code, 0)
            self.assertIn("Wrote fixture check report", stdout.getvalue())
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["summary"]["total"], 1)
            self.assertEqual(payload["summary"]["pass"], 1)
            self.assertEqual(payload["summary"]["fail"], 0)
            self.assertEqual(payload["scopes"], ["profile:mcp"])
            self.assertEqual(payload["implementation"]["metadata"]["requested_scopes"], ["profile:mcp"])
            self.assertEqual(payload["implementation"]["metadata"]["requested_scenarios"], ["mcp.intent.execution"])
            self.assertTrue(all(scenario["scope"] == "profile:mcp" for scenario in payload["scenarios"]))

    def test_validate_result_accepts_fixture_check_output(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "fixture-check.json"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "check",
                    "--repo-root",
                    str(repo_root),
                    "--json",
                    "--scope",
                    "profile:mcp",
                    "--scenario",
                    "mcp.intent.execution",
                    "--output",
                    str(output_path),
                ])
            self.assertEqual(exit_code, 0)
            report = validate_result_file(repo_root=repo_root, result_path=output_path)
            self.assertTrue(report.ok, report.to_dict())
            self.assertEqual(report.result_path.resolve(), output_path.resolve())

    def test_validate_result_reports_shape_errors(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            (repo_root / "conformance/manifest").mkdir(parents=True)
            (repo_root / "conformance/taxonomy").mkdir(parents=True)
            (repo_root / "conformance/fixtures").mkdir(parents=True)
            (repo_root / "conformance/results").mkdir(parents=True)
            (repo_root / "spec/core").mkdir(parents=True)
            (repo_root / "profiles").mkdir(parents=True)
            (repo_root / "reference/oaps-monorepo/packages/core/src").mkdir(parents=True)

            (repo_root / MANIFEST_RELATIVE_PATH).write_text(
                json.dumps(
                    {
                        "manifest_version": "1.0",
                        "tck_id": "oaps-tck",
                        "suite_version": "foundation-draft",
                        "status": "draft",
                        "entrypoints": [],
                        "taxonomy": "conformance/taxonomy/scenario-taxonomy.v1.json",
                        "fixture_index": "conformance/fixtures/index.v1.json",
                        "runner_contract": "conformance/runner-contract.md",
                        "result_schema": "conformance/results/result-schema.v1.json",
                        "normative_sources": ["spec/core/FOUNDATION-DRAFT.md"],
                        "reference_implementations": ["reference/oaps-monorepo/packages/core/src/index.ts"],
                    }
                ),
                encoding="utf-8",
            )
            (repo_root / "conformance/taxonomy/scenario-taxonomy.v1.json").write_text(
                json.dumps({"taxonomy_version": "1.0", "families": [], "coverage_levels": []}),
                encoding="utf-8",
            )
            (repo_root / "conformance/fixtures/index.v1.json").write_text(json.dumps({"index_version": "1.0", "packs": []}), encoding="utf-8")
            (repo_root / "conformance/runner-contract.md").write_text("# contract", encoding="utf-8")
            (repo_root / "conformance/results/result-schema.v1.json").write_text("{}", encoding="utf-8")
            (repo_root / "spec/core/FOUNDATION-DRAFT.md").write_text("# draft", encoding="utf-8")
            (repo_root / "reference/oaps-monorepo/packages/core/src/index.ts").write_text("export {};\n", encoding="utf-8")
            bad_result = repo_root / "conformance/results/bad-result.json"
            bad_result.write_text(json.dumps({"result_schema_version": "1.0", "manifest_id": "oaps-tck"}), encoding="utf-8")

            report = validate_result_file(repo_root=repo_root, result_path=bad_result)
            self.assertFalse(report.ok)
            self.assertTrue(any("missing required key" in issue.message for issue in report.issues))

    def test_validate_result_reports_manifest_mismatch(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            result_path = Path(tmpdir) / "mismatch.json"
            payload = json.loads((repo_root / "conformance/results/example-result.v1.json").read_text(encoding="utf-8"))
            payload["manifest_id"] = "different-manifest"
            result_path.write_text(json.dumps(payload), encoding="utf-8")

            report = validate_result_file(repo_root=repo_root, result_path=result_path)
            self.assertFalse(report.ok)
            self.assertTrue(any("manifest_id must match" in issue.message for issue in report.issues))

    def test_compatibility_declaration_summarizes_full_fixture_check(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            result_path = Path(tmpdir) / "fixture-check.json"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "check",
                    "--repo-root",
                    str(repo_root),
                    "--json",
                    "--output",
                    str(result_path),
                ])
            self.assertEqual(exit_code, 0)
            report = build_compatibility_declaration(repo_root=repo_root, result_path=result_path)
            self.assertTrue(report.ok, report.to_dict())
            self.assertEqual(report.compatible_count, len(_all_scopes()))
            self.assertEqual(report.partial_count, 0)
            self.assertEqual(report.incompatible_count, 0)
            self.assertEqual(report.not_evaluated_count, 0)
            self.assertTrue(all(scope.status == "compatible" for scope in report.scope_reports))

    def test_compatibility_declaration_marks_partial_scope_for_filtered_result(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            result_path = Path(tmpdir) / "fixture-check.json"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "check",
                    "--repo-root",
                    str(repo_root),
                    "--json",
                    "--scope",
                    "profile:mcp",
                    "--scenario",
                    "mcp.intent.execution",
                    "--output",
                    str(result_path),
                ])
            self.assertEqual(exit_code, 0)
            report = build_compatibility_declaration(repo_root=repo_root, result_path=result_path)
            self.assertTrue(report.ok, report.to_dict())
            by_scope = {scope.scope: scope for scope in report.scope_reports}
            self.assertEqual(by_scope["profile:mcp"].status, "partial")
            self.assertEqual(by_scope["profile:mcp"].pass_count, 1)
            self.assertEqual(by_scope["profile:mcp"].evaluated_scenario_count, 1)
            self.assertEqual(by_scope["core"].status, "not_evaluated")
            self.assertEqual(report.partial_count, 1)
            self.assertEqual(report.not_evaluated_count, len(_all_scopes()) - 1)

    def test_compatibility_cli_json_emits_machine_readable_declaration(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory() as tmpdir:
            result_path = Path(tmpdir) / "fixture-check.json"
            declaration_path = Path(tmpdir) / "compatibility.json"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "check",
                    "--repo-root",
                    str(repo_root),
                    "--json",
                    "--scope",
                    "profile:mcp",
                    "--scenario",
                    "mcp.intent.execution",
                    "--output",
                    str(result_path),
                ])
            self.assertEqual(exit_code, 0)

            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = main([
                    "compatibility",
                    "--repo-root",
                    str(repo_root),
                    "--result",
                    str(result_path),
                    "--json",
                    "--output",
                    str(declaration_path),
                ])
            self.assertEqual(exit_code, 0)
            self.assertIn("Wrote compatibility declaration", stdout.getvalue())
            payload = json.loads(declaration_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["declaration_schema_version"], "1.0")
            self.assertEqual(payload["summary"]["compatible"], 0)
            self.assertEqual(payload["summary"]["partial"], 1)
            self.assertEqual(payload["summary"]["not_evaluated"], len(_all_scopes()) - 1)
            mcp_scope = next(scope for scope in payload["scope_declarations"] if scope["scope"] == "profile:mcp")
            self.assertEqual(mcp_scope["status"], "partial")
            self.assertEqual(mcp_scope["evaluated_scenarios"], 1)

    def test_compatibility_cli_text_mentions_scope_statuses(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            exit_code = main([
                "compatibility",
                "--repo-root",
                str(repo_root),
                "--result",
                str(repo_root / "conformance/results/example-result.v1.json"),
            ])
        self.assertEqual(exit_code, 0)
        output = stdout.getvalue()
        self.assertIn("Compatibility declaration", output)
        self.assertIn("scope declarations", output)
        self.assertIn("core:", output)
        self.assertIn("binding:http:", output)


if __name__ == "__main__":
    unittest.main()
