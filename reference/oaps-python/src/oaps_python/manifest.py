from __future__ import annotations

import json
from datetime import datetime, timezone
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


MANIFEST_RELATIVE_PATH = Path("conformance/manifest/oaps-tck.manifest.v1.json")


@dataclass(frozen=True)
class ValidationIssue:
    path: str
    message: str


@dataclass(frozen=True)
class ValidationReport:
    manifest_path: Path
    repo_root: Path
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "manifest_path": str(self.manifest_path),
            "repo_root": str(self.repo_root),
            "issues": [
                {"path": issue.path, "message": issue.message}
                for issue in self.issues
            ],
        }


@dataclass(frozen=True)
class FixtureScenario:
    scope: str
    scenario_id: str
    coverage: tuple[str, ...]
    pack_path: str


@dataclass(frozen=True)
class FixturePackInventory:
    scope: str
    path: str
    scenario_ids: tuple[str, ...]

    @property
    def scenario_count(self) -> int:
        return len(self.scenario_ids)


@dataclass(frozen=True)
class InventoryReport:
    manifest_path: Path
    repo_root: Path
    manifest: ConformanceManifest | None
    packs: tuple[FixturePackInventory, ...]
    scenarios: tuple[FixtureScenario, ...]
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues

    @property
    def total_packs(self) -> int:
        return len(self.packs)

    @property
    def total_scenarios(self) -> int:
        return len(self.scenarios)

    @property
    def scopes(self) -> tuple[str, ...]:
        return tuple(pack.scope for pack in self.packs)

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "manifest_path": str(self.manifest_path),
            "repo_root": str(self.repo_root),
            "manifest": None if self.manifest is None else {
                "manifest_version": self.manifest.manifest_version,
                "tck_id": self.manifest.tck_id,
                "suite_version": self.manifest.suite_version,
                "status": self.manifest.status,
            },
            "summary": {
                "packs": self.total_packs,
                "scenarios": self.total_scenarios,
                "scopes": list(self.scopes),
            },
            "packs": [
                {
                    "scope": pack.scope,
                    "path": pack.path,
                    "scenario_count": pack.scenario_count,
                    "scenario_ids": list(pack.scenario_ids),
                }
                for pack in self.packs
            ],
            "scenarios": [
                {
                    "scope": scenario.scope,
                    "scenario_id": scenario.scenario_id,
                    "coverage": list(scenario.coverage),
                    "pack_path": scenario.pack_path,
                }
                for scenario in self.scenarios
            ],
            "issues": [
                {"path": issue.path, "message": issue.message}
                for issue in self.issues
            ],
        }

    def to_result_dict(
        self,
        *,
        implementation_id: str = "oaps-python",
        implementation_version: str = "0.1.0",
    ) -> dict[str, Any]:
        scopes = list(self.scopes)
        total = self.total_scenarios
        executed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        return {
            "result_schema_version": "1.0",
            "manifest_id": self.manifest.tck_id if self.manifest else "oaps-tck",
            "runner_id": "oaps-python-inventory",
            "implementation": {
                "implementation_id": implementation_id,
                "implementation_version": implementation_version,
                "metadata": {
                    "mode": "inventory",
                    "issues_present": bool(self.issues),
                },
            },
            "executed_at": executed_at,
            "scopes": scopes,
            "summary": {
                "pass": 0,
                "fail": 0,
                "skip": total,
                "error": 0,
                "total": total,
            },
            "scenarios": [
                {
                    "scenario_id": scenario.scenario_id,
                    "scope": scenario.scope,
                    "outcome": "skip",
                    "coverage": list(scenario.coverage),
                    "notes": "inventory-only run; no implementation execution was performed",
                    "artifacts": [scenario.pack_path],
                }
                for scenario in self.scenarios
            ],
        }


@dataclass(frozen=True)
class ConformanceManifest:
    manifest_version: str
    tck_id: str
    suite_version: str
    status: str
    entrypoints: tuple[dict[str, Any], ...]
    taxonomy: str
    fixture_index: str
    runner_contract: str
    result_schema: str
    normative_sources: tuple[str, ...]
    reference_implementations: tuple[str, ...]

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "ConformanceManifest":
        required_keys = [
            "manifest_version",
            "tck_id",
            "suite_version",
            "status",
            "entrypoints",
            "taxonomy",
            "fixture_index",
            "runner_contract",
            "result_schema",
            "normative_sources",
            "reference_implementations",
        ]
        missing = [key for key in required_keys if key not in data]
        if missing:
            raise ValueError(f"manifest missing required keys: {', '.join(missing)}")

        entrypoints = data["entrypoints"]
        normative_sources = data["normative_sources"]
        reference_implementations = data["reference_implementations"]
        if not isinstance(entrypoints, list):
            raise ValueError("manifest entrypoints must be a list")
        if not isinstance(normative_sources, list):
            raise ValueError("manifest normative_sources must be a list")
        if not isinstance(reference_implementations, list):
            raise ValueError("manifest reference_implementations must be a list")

        return cls(
            manifest_version=str(data["manifest_version"]),
            tck_id=str(data["tck_id"]),
            suite_version=str(data["suite_version"]),
            status=str(data["status"]),
            entrypoints=tuple(entrypoints),
            taxonomy=str(data["taxonomy"]),
            fixture_index=str(data["fixture_index"]),
            runner_contract=str(data["runner_contract"]),
            result_schema=str(data["result_schema"]),
            normative_sources=tuple(str(item) for item in normative_sources),
            reference_implementations=tuple(str(item) for item in reference_implementations),
        )


def discover_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    for candidate in (current, *current.parents):
        if (candidate / MANIFEST_RELATIVE_PATH).exists():
            return candidate
    raise FileNotFoundError(
        f"Could not find {MANIFEST_RELATIVE_PATH} from {current}"
    )


def load_json_file(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def _resolve_repo_path(repo_root: Path, relative_path: str) -> Path:
    return (repo_root / relative_path).resolve()


def _require_file_exists(repo_root: Path, relative_path: str, issues: list[ValidationIssue], source: str) -> None:
    target = _resolve_repo_path(repo_root, relative_path)
    if not target.exists():
        issues.append(
            ValidationIssue(
                path=source,
                message=f"missing referenced file: {relative_path}",
            )
        )


def validate_repository(repo_root: Path | None = None, manifest_path: Path | None = None) -> ValidationReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    manifest_path = (manifest_path or repo_root / MANIFEST_RELATIVE_PATH).resolve()
    issues: list[ValidationIssue] = []

    if not manifest_path.exists():
        issues.append(
            ValidationIssue(
                path=str(manifest_path),
                message="conformance manifest does not exist",
            )
        )
        return ValidationReport(manifest_path=manifest_path, repo_root=repo_root, issues=tuple(issues))

    manifest = ConformanceManifest.from_json(load_json_file(manifest_path))
    for entrypoint in manifest.entrypoints:
        if not isinstance(entrypoint, dict):
            issues.append(
                ValidationIssue(
                    path=str(manifest_path),
                    message="entrypoints must be JSON objects",
                )
            )
            continue
        pack = entrypoint.get("pack")
        if isinstance(pack, str):
            _require_file_exists(repo_root, pack, issues, str(manifest_path))

    _require_file_exists(repo_root, manifest.taxonomy, issues, str(manifest_path))
    _require_file_exists(repo_root, manifest.fixture_index, issues, str(manifest_path))
    _require_file_exists(repo_root, manifest.runner_contract, issues, str(manifest_path))
    _require_file_exists(repo_root, manifest.result_schema, issues, str(manifest_path))

    for source in manifest.normative_sources:
        _require_file_exists(repo_root, source, issues, str(manifest_path))

    for source in manifest.reference_implementations:
        _require_file_exists(repo_root, source, issues, str(manifest_path))

    fixture_index_path = _resolve_repo_path(repo_root, manifest.fixture_index)
    if fixture_index_path.exists():
        fixture_index = load_json_file(fixture_index_path)
        packs = fixture_index.get("packs", [])
        if not isinstance(packs, list):
            issues.append(
                ValidationIssue(
                    path=str(fixture_index_path),
                    message="fixture index packs must be a list",
                )
            )
        for pack in packs:
            if not isinstance(pack, dict):
                issues.append(
                    ValidationIssue(
                        path=str(fixture_index_path),
                        message="fixture pack entries must be JSON objects",
                    )
                )
                continue
            pack_path = pack.get("path")
            if isinstance(pack_path, str):
                _require_file_exists(repo_root, pack_path, issues, str(fixture_index_path))
                pack_file = _resolve_repo_path(repo_root, pack_path)
                if pack_file.exists():
                    pack_json = load_json_file(pack_file)
                    for fixture in pack_json.get("fixtures", []):
                        if not isinstance(fixture, dict):
                            issues.append(
                                ValidationIssue(
                                    path=str(pack_file),
                                    message="fixture entries must be JSON objects",
                                )
                            )
                            continue
                        for key in ("schema", "example", "reference_test"):
                            value = fixture.get(key)
                            if isinstance(value, str):
                                _require_file_exists(repo_root, value, issues, str(pack_file))

    return ValidationReport(manifest_path=manifest_path, repo_root=repo_root, issues=tuple(issues))


def inventory_repository(repo_root: Path | None = None, manifest_path: Path | None = None) -> InventoryReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    manifest_path = (manifest_path or repo_root / MANIFEST_RELATIVE_PATH).resolve()
    issues: list[ValidationIssue] = []

    if not manifest_path.exists():
        issues.append(
            ValidationIssue(
                path=str(manifest_path),
                message="conformance manifest does not exist",
            )
        )
        return InventoryReport(
            manifest_path=manifest_path,
            repo_root=repo_root,
            manifest=None,
            packs=tuple(),
            scenarios=tuple(),
            issues=tuple(issues),
        )

    manifest = ConformanceManifest.from_json(load_json_file(manifest_path))
    fixture_index_path = _resolve_repo_path(repo_root, manifest.fixture_index)
    packs: list[FixturePackInventory] = []
    scenarios: list[FixtureScenario] = []

    if not fixture_index_path.exists():
        issues.append(
            ValidationIssue(
                path=str(manifest_path),
                message=f"missing referenced file: {manifest.fixture_index}",
            )
        )
    else:
        fixture_index = load_json_file(fixture_index_path)
        for pack in fixture_index.get("packs", []):
            if not isinstance(pack, dict):
                continue
            scope = str(pack.get("scope", ""))
            pack_path = str(pack.get("path", ""))
            pack_file = _resolve_repo_path(repo_root, pack_path)
            scenario_ids: list[str] = []
            if pack_file.exists():
                pack_json = load_json_file(pack_file)
                for fixture in pack_json.get("fixtures", []):
                    if not isinstance(fixture, dict):
                        continue
                    scenario_id = str(fixture.get("scenario_id", ""))
                    if not scenario_id:
                        continue
                    scenario_ids.append(scenario_id)
                    scenarios.append(
                        FixtureScenario(
                            scope=scope,
                            scenario_id=scenario_id,
                            coverage=tuple(str(item) for item in fixture.get("coverage", [])),
                            pack_path=pack_path,
                        )
                    )
            packs.append(FixturePackInventory(scope=scope, path=pack_path, scenario_ids=tuple(scenario_ids)))

    validation = validate_repository(repo_root=repo_root, manifest_path=manifest_path)
    issues.extend(validation.issues)

    return InventoryReport(
        manifest_path=manifest_path,
        repo_root=repo_root,
        manifest=manifest,
        packs=tuple(packs),
        scenarios=tuple(scenarios),
        issues=tuple(issues),
    )
