from __future__ import annotations

import json
from datetime import datetime, timezone
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable


MANIFEST_RELATIVE_PATH = Path("conformance/manifest/oaps-tck.manifest.v1.json")
RESULT_SCHEMA_RELATIVE_PATH = Path("conformance/results/result-schema.v1.json")
COMPATIBILITY_DECLARATION_SCHEMA_RELATIVE_PATH = Path(
    "conformance/results/compatibility-declaration-schema.v1.json"
)


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
    requested_scopes: tuple[str, ...] = field(default_factory=tuple)
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
            "requested_scopes": list(self.requested_scopes),
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
                    "requested_scopes": list(self.requested_scopes),
                },
            },
            "executed_at": executed_at,
            "requested_scopes": list(self.requested_scopes),
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
class FixtureCheckScenarioResult:
    scope: str
    scenario_id: str
    outcome: str
    coverage: tuple[str, ...]
    pack_path: str
    artifacts: tuple[str, ...] = field(default_factory=tuple)
    notes: str = ''


@dataclass(frozen=True)
class FixtureCheckReport:
    manifest_path: Path
    repo_root: Path
    manifest: ConformanceManifest | None
    requested_scopes: tuple[str, ...] = field(default_factory=tuple)
    requested_scenarios: tuple[str, ...] = field(default_factory=tuple)
    scopes: tuple[str, ...] = field(default_factory=tuple)
    scenarios: tuple[FixtureCheckScenarioResult, ...] = field(default_factory=tuple)
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues and all(scenario.outcome == 'pass' for scenario in self.scenarios)

    @property
    def total_pass(self) -> int:
        return sum(1 for scenario in self.scenarios if scenario.outcome == 'pass')

    @property
    def total_fail(self) -> int:
        return sum(1 for scenario in self.scenarios if scenario.outcome == 'fail')

    @property
    def total_error(self) -> int:
        return sum(1 for scenario in self.scenarios if scenario.outcome == 'error')

    @property
    def total_skip(self) -> int:
        return sum(1 for scenario in self.scenarios if scenario.outcome == 'skip')

    @property
    def total_scenarios(self) -> int:
        return len(self.scenarios)

    def to_dict(self) -> dict[str, Any]:
        return {
            'ok': self.ok,
            'manifest_path': str(self.manifest_path),
            'repo_root': str(self.repo_root),
            'manifest': None if self.manifest is None else {
                'manifest_version': self.manifest.manifest_version,
                'tck_id': self.manifest.tck_id,
                'suite_version': self.manifest.suite_version,
                'status': self.manifest.status,
            },
            'requested_scopes': list(self.requested_scopes),
            'requested_scenarios': list(self.requested_scenarios),
            'summary': {
                'pass': self.total_pass,
                'fail': self.total_fail,
                'skip': self.total_skip,
                'error': self.total_error,
                'total': self.total_scenarios,
                'scopes': list(self.scopes),
            },
            'scenarios': [
                {
                    'scope': scenario.scope,
                    'scenario_id': scenario.scenario_id,
                    'outcome': scenario.outcome,
                    'coverage': list(scenario.coverage),
                    'pack_path': scenario.pack_path,
                    'artifacts': list(scenario.artifacts),
                    'notes': scenario.notes,
                }
                for scenario in self.scenarios
            ],
            'issues': [
                {'path': issue.path, 'message': issue.message}
                for issue in self.issues
            ],
        }

    def to_result_dict(
        self,
        *,
        implementation_id: str = 'oaps-python',
        implementation_version: str = '0.1.0',
    ) -> dict[str, Any]:
        executed_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        return {
            'result_schema_version': '1.0',
            'manifest_id': self.manifest.tck_id if self.manifest else 'oaps-tck',
            'runner_id': 'oaps-python-fixture-check',
            'implementation': {
                'implementation_id': implementation_id,
                'implementation_version': implementation_version,
                'metadata': {
                    'mode': 'fixture-check',
                    'issues_present': bool(self.issues),
                    'requested_scopes': list(self.requested_scopes),
                    'requested_scenarios': list(self.requested_scenarios),
                    'issues': [
                        {'path': issue.path, 'message': issue.message}
                        for issue in self.issues
                    ],
                },
            },
            'executed_at': executed_at,
            'scopes': list(self.scopes),
            'summary': {
                'pass': self.total_pass,
                'fail': self.total_fail,
                'skip': self.total_skip,
                'error': self.total_error,
                'total': self.total_scenarios,
            },
            'scenarios': [
                {
                    'scenario_id': scenario.scenario_id,
                    'scope': scenario.scope,
                    'outcome': scenario.outcome,
                    'coverage': list(scenario.coverage),
                    'notes': scenario.notes,
                    'artifacts': list(scenario.artifacts),
                }
                for scenario in self.scenarios
            ],
        }


@dataclass(frozen=True)
class ResultValidationReport:
    result_path: Path
    repo_root: Path
    result_schema_path: Path
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues

    def to_dict(self) -> dict[str, Any]:
        return {
            'ok': self.ok,
            'result_path': str(self.result_path),
            'repo_root': str(self.repo_root),
            'result_schema_path': str(self.result_schema_path),
            'issues': [
                {'path': issue.path, 'message': issue.message}
                for issue in self.issues
            ],
        }


@dataclass(frozen=True)
class DeclarationValidationReport:
    declaration_path: Path
    repo_root: Path
    declaration_schema_path: Path
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues

    def to_dict(self) -> dict[str, Any]:
        return {
            'ok': self.ok,
            'declaration_path': str(self.declaration_path),
            'repo_root': str(self.repo_root),
            'declaration_schema_path': str(self.declaration_schema_path),
            'issues': [
                {'path': issue.path, 'message': issue.message}
                for issue in self.issues
            ],
        }


@dataclass(frozen=True)
class CompatibilityScopeReport:
    scope: str
    status: str
    selected_in_result: bool
    known_scenarios: tuple[str, ...]
    evaluated_scenarios: tuple[str, ...]
    coverage_observed: tuple[str, ...]
    pass_count: int
    fail_count: int
    skip_count: int
    error_count: int

    @property
    def known_scenario_count(self) -> int:
        return len(self.known_scenarios)

    @property
    def evaluated_scenario_count(self) -> int:
        return len(self.evaluated_scenarios)


@dataclass(frozen=True)
class ScopeComparison:
    scope: str
    before_status: str
    after_status: str


@dataclass(frozen=True)
class ComparisonReport:
    comparison_kind: str
    left_path: Path
    right_path: Path
    repo_root: Path
    changed_scopes: tuple[ScopeComparison, ...]
    layer_summaries: tuple[dict[str, Any], ...]
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues

    def to_dict(self) -> dict[str, Any]:
        return {
            'ok': self.ok,
            'comparison_kind': self.comparison_kind,
            'left_path': str(self.left_path),
            'right_path': str(self.right_path),
            'repo_root': str(self.repo_root),
            'changed_scopes': [
                {
                    'scope': change.scope,
                    'before_status': change.before_status,
                    'after_status': change.after_status,
                }
                for change in self.changed_scopes
            ],
            'layer_summaries': list(self.layer_summaries),
            'issues': [
                {'path': issue.path, 'message': issue.message}
                for issue in self.issues
            ],
        }


@dataclass(frozen=True)
class CompatibilityDeclarationReport:
    result_path: Path
    repo_root: Path
    manifest: ConformanceManifest | None
    implementation: dict[str, Any]
    runner_id: str
    result_executed_at: str
    selected_scopes: tuple[str, ...]
    scope_reports: tuple[CompatibilityScopeReport, ...]
    compatibility_schema_path: Path
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.issues

    @property
    def compatible_count(self) -> int:
        return sum(1 for scope in self.scope_reports if scope.status == 'compatible')

    @property
    def partial_count(self) -> int:
        return sum(1 for scope in self.scope_reports if scope.status == 'partial')

    @property
    def incompatible_count(self) -> int:
        return sum(1 for scope in self.scope_reports if scope.status == 'incompatible')

    @property
    def not_evaluated_count(self) -> int:
        return sum(1 for scope in self.scope_reports if scope.status == 'not_evaluated')

    def to_dict(self) -> dict[str, Any]:
        generated_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        return {
            'declaration_schema_version': '1.0',
            'manifest_id': self.manifest.tck_id if self.manifest else 'oaps-tck',
            'suite_version': self.manifest.suite_version if self.manifest else '',
            'generated_at': generated_at,
            'source_result': {
                'result_path': str(self.result_path),
                'runner_id': self.runner_id,
                'executed_at': self.result_executed_at,
            },
            'implementation': self.implementation,
            'selected_scopes': list(self.selected_scopes),
            'summary': {
                'compatible': self.compatible_count,
                'partial': self.partial_count,
                'incompatible': self.incompatible_count,
                'not_evaluated': self.not_evaluated_count,
                'total': len(self.scope_reports),
            },
            'scope_declarations': [
                {
                    'scope': scope.scope,
                    'status': scope.status,
                    'selected_in_result': scope.selected_in_result,
                    'known_scenarios': scope.known_scenario_count,
                    'evaluated_scenarios': scope.evaluated_scenario_count,
                    'pass': scope.pass_count,
                    'fail': scope.fail_count,
                    'skip': scope.skip_count,
                    'error': scope.error_count,
                    'coverage_observed': list(scope.coverage_observed),
                    'known_scenario_ids': list(scope.known_scenarios),
                    'evaluated_scenario_ids': list(scope.evaluated_scenarios),
                }
                for scope in self.scope_reports
            ],
            'issues': [
                {'path': issue.path, 'message': issue.message}
                for issue in self.issues
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


def load_json_file(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


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


def _unique_preserve_order(values: Iterable[str]) -> tuple[str, ...]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return tuple(ordered)


def _validate_date_time(value: Any) -> bool:
    if not isinstance(value, str) or not value:
        return False
    try:
        datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return False
    return True


def _validate_non_empty_string_list(value: Any) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) and item for item in value)


def _validate_result_scenario(scenario: Any, issues: list[ValidationIssue], source: str) -> None:
    if not isinstance(scenario, dict):
        issues.append(
            ValidationIssue(
                path=source,
                message='result scenarios must be JSON objects',
            )
        )
        return

    for key in ('scenario_id', 'scope', 'outcome', 'coverage'):
        if key not in scenario:
            issues.append(
                ValidationIssue(
                    path=source,
                    message=f'result scenario is missing required key: {key}',
                )
            )
            return

    if not isinstance(scenario['scenario_id'], str) or not scenario['scenario_id']:
        issues.append(ValidationIssue(path=source, message='result scenario scenario_id must be a non-empty string'))
    if not isinstance(scenario['scope'], str) or not scenario['scope']:
        issues.append(ValidationIssue(path=source, message='result scenario scope must be a non-empty string'))
    if scenario['outcome'] not in {'pass', 'fail', 'skip', 'error'}:
        issues.append(
            ValidationIssue(
                path=source,
                message='result scenario outcome must be one of pass, fail, skip, error',
            )
        )
    if not _validate_non_empty_string_list(scenario['coverage']):
        issues.append(ValidationIssue(path=source, message='result scenario coverage must be a non-empty list of strings'))

    if 'duration_ms' in scenario and (not isinstance(scenario['duration_ms'], int) or scenario['duration_ms'] < 0):
        issues.append(ValidationIssue(path=source, message='result scenario duration_ms must be a non-negative integer'))
    if 'notes' in scenario and not isinstance(scenario['notes'], str):
        issues.append(ValidationIssue(path=source, message='result scenario notes must be a string'))
    if 'artifacts' in scenario and not _validate_non_empty_string_list(scenario['artifacts']):
        issues.append(ValidationIssue(path=source, message='result scenario artifacts must be a list of non-empty strings'))

    allowed_keys = {'scenario_id', 'scope', 'outcome', 'coverage', 'duration_ms', 'notes', 'artifacts'}
    extra_keys = sorted(set(scenario) - allowed_keys)
    if extra_keys:
        issues.append(
            ValidationIssue(
                path=source,
                message=f'result scenario contains unsupported keys: {", ".join(extra_keys)}',
            )
        )


def _load_taxonomy_dimensions(repo_root: Path, taxonomy_path: str, issues: list[ValidationIssue], source: str) -> dict[str, set[str]]:
    taxonomy_file = _resolve_repo_path(repo_root, taxonomy_path)
    if not taxonomy_file.exists():
        return {}

    taxonomy = load_json_file(taxonomy_file)
    families = taxonomy.get('families', [])
    if not isinstance(families, list):
        issues.append(
            ValidationIssue(
                path=str(taxonomy_file),
                message='scenario taxonomy families must be a list',
            )
        )
        return {}

    dimensions: dict[str, set[str]] = {}
    for family in families:
        if not isinstance(family, dict):
            issues.append(
                ValidationIssue(
                    path=str(taxonomy_file),
                    message='scenario taxonomy families must be JSON objects',
                )
            )
            continue
        family_id = str(family.get('id', ''))
        family_dimensions = family.get('dimensions', [])
        if not family_id:
            issues.append(
                ValidationIssue(
                    path=str(taxonomy_file),
                    message='scenario taxonomy family is missing an id',
                )
            )
            continue
        if not isinstance(family_dimensions, list):
            issues.append(
                ValidationIssue(
                    path=str(taxonomy_file),
                    message=f'scenario taxonomy family {family_id} dimensions must be a list',
                )
            )
            continue
        dimensions[family_id] = {str(dimension) for dimension in family_dimensions}

    if not dimensions:
        issues.append(
            ValidationIssue(
                path=source,
                message='scenario taxonomy does not define any families',
            )
        )
    return dimensions


def _load_taxonomy_coverage_levels(
    repo_root: Path,
    taxonomy_path: str,
    issues: list[ValidationIssue],
) -> set[str]:
    taxonomy_file = _resolve_repo_path(repo_root, taxonomy_path)
    if not taxonomy_file.exists():
        return set()

    taxonomy = load_json_file(taxonomy_file)
    coverage_levels = taxonomy.get('coverage_levels', [])
    if not isinstance(coverage_levels, list):
        issues.append(
            ValidationIssue(
                path=str(taxonomy_file),
                message='scenario taxonomy coverage_levels must be a list',
            )
        )
        return set()

    return {str(level) for level in coverage_levels if isinstance(level, str) and level}


def _scope_layer(scope: str) -> str:
    if scope == 'core':
        return 'core'
    if ':' in scope:
        return scope.split(':', 1)[0]
    return 'other'


def _pack_entries_by_scope(repo_root: Path, manifest: ConformanceManifest, issues: list[ValidationIssue]) -> dict[str, dict[str, Any]]:
    fixture_index_path = _resolve_repo_path(repo_root, manifest.fixture_index)
    if not fixture_index_path.exists():
        issues.append(
            ValidationIssue(
                path=str(fixture_index_path),
                message=f'missing referenced file: {manifest.fixture_index}',
            )
        )
        return {}

    fixture_index = load_json_file(fixture_index_path)
    packs = fixture_index.get('packs', [])
    if not isinstance(packs, list):
        issues.append(
            ValidationIssue(
                path=str(fixture_index_path),
                message='fixture index packs must be a list',
            )
        )
        return {}

    entries: dict[str, dict[str, Any]] = {}
    for pack in packs:
        if not isinstance(pack, dict):
            issues.append(
                ValidationIssue(
                    path=str(fixture_index_path),
                    message='fixture pack entries must be JSON objects',
                )
            )
            continue
        scope = str(pack.get('scope', ''))
        pack_path = str(pack.get('path', ''))
        if not scope or not pack_path:
            issues.append(
                ValidationIssue(
                    path=str(fixture_index_path),
                    message='fixture pack entries must include scope and path',
                )
            )
            continue
        entries[scope] = {'scope': scope, 'path': pack_path}
    return entries


def _load_fixture_scenarios_by_scope(
    repo_root: Path,
    manifest: ConformanceManifest,
    issues: list[ValidationIssue],
) -> dict[str, tuple[FixtureScenario, ...]]:
    pack_entries = _pack_entries_by_scope(repo_root, manifest, issues)
    scenarios_by_scope: dict[str, tuple[FixtureScenario, ...]] = {}
    for scope, pack_entry in pack_entries.items():
        pack_path = str(pack_entry['path'])
        pack_file = _resolve_repo_path(repo_root, pack_path)
        if not pack_file.exists():
            continue
        try:
            pack_json = load_json_file(pack_file)
        except (OSError, ValueError, json.JSONDecodeError) as error:
            issues.append(
                ValidationIssue(
                    path=str(pack_file),
                    message=f'invalid fixture pack JSON: {error}',
                )
            )
            continue
        fixtures = pack_json.get('fixtures', [])
        if not isinstance(fixtures, list):
            issues.append(
                ValidationIssue(
                    path=str(pack_file),
                    message='fixture pack fixtures must be a list',
                )
            )
            continue
        scope_scenarios: list[FixtureScenario] = []
        for fixture in fixtures:
            if not isinstance(fixture, dict):
                continue
            scenario_id = str(fixture.get('scenario_id', '')).strip()
            if not scenario_id:
                continue
            coverage = fixture.get('coverage', [])
            scope_scenarios.append(
                FixtureScenario(
                    scope=scope,
                    scenario_id=scenario_id,
                    coverage=tuple(str(item) for item in coverage if str(item)) if isinstance(coverage, list) else tuple(),
                    pack_path=pack_path,
                )
            )
        scenarios_by_scope[scope] = tuple(scope_scenarios)
    return scenarios_by_scope


def fixture_check_repository(
    repo_root: Path | None = None,
    manifest_path: Path | None = None,
    requested_scopes: tuple[str, ...] | None = None,
    requested_scenarios: tuple[str, ...] | None = None,
) -> FixtureCheckReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    manifest_path = (manifest_path or repo_root / MANIFEST_RELATIVE_PATH).resolve()
    issues: list[ValidationIssue] = []
    requested_scopes = _unique_preserve_order(requested_scopes or ())
    requested_scenarios = _unique_preserve_order(requested_scenarios or ())

    if not manifest_path.exists():
        issues.append(
            ValidationIssue(
                path=str(manifest_path),
                message='conformance manifest does not exist',
            )
        )
        return FixtureCheckReport(
            manifest_path=manifest_path,
            repo_root=repo_root,
            manifest=None,
            requested_scopes=requested_scopes,
            requested_scenarios=requested_scenarios,
            scopes=requested_scopes,
            scenarios=tuple(),
            issues=tuple(issues),
        )

    manifest = ConformanceManifest.from_json(load_json_file(manifest_path))
    validation = validate_repository(repo_root=repo_root, manifest_path=manifest_path)
    issues.extend(validation.issues)
    pack_entries = _pack_entries_by_scope(repo_root, manifest, issues)
    taxonomy_dimensions = _load_taxonomy_dimensions(repo_root, manifest.taxonomy, issues, str(manifest_path))

    selected_scopes = requested_scopes or tuple(pack_entries.keys())
    check_scenarios: list[FixtureCheckScenarioResult] = []
    seen_requested_scenarios: set[str] = set()

    for scope in selected_scopes:
        pack_entry = pack_entries.get(scope)
        if pack_entry is None:
            issues.append(
                ValidationIssue(
                    path=str(manifest_path),
                    message=f'requested scope not found in fixture index: {scope}',
                )
            )
            continue

        pack_path = pack_entry['path']
        pack_file = _resolve_repo_path(repo_root, pack_path)
        if not pack_file.exists():
            issues.append(
                ValidationIssue(
                    path=str(pack_file),
                    message=f'missing referenced file: {pack_path}',
                )
            )
            continue

        pack_json = load_json_file(pack_file)
        pack_scope = str(pack_json.get('scope', scope))
        if pack_scope != scope:
            issues.append(
                ValidationIssue(
                    path=str(pack_file),
                    message=f'fixture pack scope mismatch: expected {scope}, got {pack_scope}',
                )
            )

        fixtures = pack_json.get('fixtures', [])
        if not isinstance(fixtures, list):
            issues.append(
                ValidationIssue(
                    path=str(pack_file),
                    message='fixture pack fixtures must be a list',
                )
            )
            continue

        allowed_dimensions = taxonomy_dimensions.get(scope)
        for fixture in fixtures:
            if not isinstance(fixture, dict):
                issues.append(
                    ValidationIssue(
                        path=str(pack_file),
                        message='fixture entries must be JSON objects',
                    )
                )
                continue

            scenario_id = str(fixture.get('scenario_id', '')).strip()
            if not scenario_id:
                issues.append(
                    ValidationIssue(
                        path=str(pack_file),
                        message='fixture scenario_id is required',
                    )
                )
                continue
            if requested_scenarios and scenario_id not in requested_scenarios:
                continue
            if requested_scenarios:
                seen_requested_scenarios.add(scenario_id)

            dimension = str(fixture.get('dimension', '')).strip()
            coverage_raw = fixture.get('coverage', [])
            if isinstance(coverage_raw, list):
                coverage = tuple(str(item) for item in coverage_raw if str(item))
            else:
                coverage = tuple()

            artifacts = [pack_path]
            outcome = 'pass'
            notes: list[str] = ['static fixture check; no runtime execution was performed']

            if not coverage:
                coverage = ('manifest-consistency',)
                outcome = 'fail'
                notes.append('fixture coverage was missing or invalid')

            if not dimension:
                outcome = 'fail'
                notes.append('fixture dimension is missing')
            elif allowed_dimensions is not None and dimension not in allowed_dimensions:
                outcome = 'fail'
                notes.append(f'fixture dimension {dimension} is not permitted for scope {scope}')

            for key in ('schema', 'example', 'reference_test'):
                value = fixture.get(key)
                if not isinstance(value, str) or not value:
                    continue
                artifacts.append(value)
                target = _resolve_repo_path(repo_root, value)
                if not target.exists():
                    outcome = 'fail'
                    notes.append(f'missing referenced file: {value}')
                    issues.append(
                        ValidationIssue(
                            path=str(pack_file),
                            message=f'missing referenced file: {value}',
                        )
                    )
                    continue
                if key in {'schema', 'example'} and target.suffix == '.json':
                    try:
                        load_json_file(target)
                    except (OSError, ValueError, json.JSONDecodeError) as error:
                        outcome = 'fail'
                        notes.append(f'invalid json fixture file: {value}')
                        issues.append(
                            ValidationIssue(
                                path=str(target),
                                message=f'invalid json fixture file: {value}: {error}',
                            )
                        )

            check_scenarios.append(
                FixtureCheckScenarioResult(
                    scope=scope,
                    scenario_id=scenario_id,
                    outcome=outcome,
                    coverage=coverage,
                    pack_path=pack_path,
                    artifacts=tuple(_unique_preserve_order(artifacts)),
                    notes='; '.join(notes),
                )
            )

    if requested_scenarios:
        missing_scenarios = [scenario_id for scenario_id in requested_scenarios if scenario_id not in seen_requested_scenarios]
        for scenario_id in missing_scenarios:
            issues.append(
                ValidationIssue(
                    path=str(manifest_path),
                    message=f'requested scenario not found in fixture packs: {scenario_id}',
                )
            )

    return FixtureCheckReport(
        manifest_path=manifest_path,
        repo_root=repo_root,
        manifest=manifest,
        requested_scopes=requested_scopes,
        requested_scenarios=requested_scenarios,
        scopes=selected_scopes,
        scenarios=tuple(check_scenarios),
        issues=tuple(issues),
    )


def validate_result_file(
    repo_root: Path | None = None,
    result_path: Path | None = None,
    result_schema_path: Path | None = None,
) -> ResultValidationReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    result_schema_path = (result_schema_path or repo_root / RESULT_SCHEMA_RELATIVE_PATH).resolve()
    result_path = (result_path or repo_root / 'conformance/results/example-result.v1.json').resolve()
    issues: list[ValidationIssue] = []
    manifest_path = (repo_root / MANIFEST_RELATIVE_PATH).resolve()
    manifest: ConformanceManifest | None = None
    known_scopes: set[str] = set()
    known_scenarios_by_scope: dict[str, set[str]] = {}
    allowed_coverage_levels: set[str] = set()

    if not manifest_path.exists():
        issues.append(
            ValidationIssue(
                path=str(manifest_path),
                message='conformance manifest does not exist',
            )
        )
    else:
        try:
            manifest = ConformanceManifest.from_json(load_json_file(manifest_path))
            known_scopes = {entry.get('scope', '') for entry in manifest.entrypoints if isinstance(entry, dict)}
            fixture_scenarios_by_scope = _load_fixture_scenarios_by_scope(repo_root, manifest, issues)
            known_scenarios_by_scope = {
                scope: {scenario.scenario_id for scenario in scenarios}
                for scope, scenarios in fixture_scenarios_by_scope.items()
            }
            allowed_coverage_levels = _load_taxonomy_coverage_levels(repo_root, manifest.taxonomy, issues)
        except (OSError, ValueError, json.JSONDecodeError) as error:
            issues.append(
                ValidationIssue(
                    path=str(manifest_path),
                    message=f'invalid conformance manifest: {error}',
                )
            )

    if not result_schema_path.exists():
        issues.append(
            ValidationIssue(
                path=str(result_schema_path),
                message='result schema does not exist',
            )
        )

    if not result_path.exists():
        issues.append(
            ValidationIssue(
                path=str(result_path),
                message='conformance result file does not exist',
            )
        )
        return ResultValidationReport(
            result_path=result_path,
            repo_root=repo_root,
            result_schema_path=result_schema_path,
            issues=tuple(issues),
        )

    try:
        payload = load_json_file(result_path)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        issues.append(
            ValidationIssue(
                path=str(result_path),
                message=f'invalid JSON result file: {error}',
            )
        )
        return ResultValidationReport(
            result_path=result_path,
            repo_root=repo_root,
            result_schema_path=result_schema_path,
            issues=tuple(issues),
        )

    required_keys = (
        'result_schema_version',
        'manifest_id',
        'runner_id',
        'implementation',
        'executed_at',
        'scopes',
        'summary',
        'scenarios',
    )
    for key in required_keys:
        if key not in payload:
            issues.append(
                ValidationIssue(
                    path=str(result_path),
                    message=f'result file is missing required key: {key}',
                )
            )

    extra_top_level_keys = sorted(set(payload) - set(required_keys))
    if extra_top_level_keys:
        issues.append(
            ValidationIssue(
                path=str(result_path),
                message=f'result file contains unsupported keys: {", ".join(extra_top_level_keys)}',
            )
        )

    if payload.get('result_schema_version') != '1.0':
        issues.append(ValidationIssue(path=str(result_path), message='result_schema_version must be 1.0'))
    if not isinstance(payload.get('manifest_id'), str) or not payload['manifest_id']:
        issues.append(ValidationIssue(path=str(result_path), message='manifest_id must be a non-empty string'))
    if not isinstance(payload.get('runner_id'), str) or not payload['runner_id']:
        issues.append(ValidationIssue(path=str(result_path), message='runner_id must be a non-empty string'))
    if manifest is not None and payload.get('manifest_id') != manifest.tck_id:
        issues.append(
            ValidationIssue(
                path=str(result_path),
                message=f'manifest_id must match the suite manifest tck_id: {manifest.tck_id}',
            )
        )

    implementation = payload.get('implementation')
    if not isinstance(implementation, dict):
        issues.append(ValidationIssue(path=str(result_path), message='implementation must be a JSON object'))
    else:
        for key in ('implementation_id', 'implementation_version'):
            if key not in implementation:
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'implementation is missing required key: {key}',
                    )
                )
        if not isinstance(implementation.get('implementation_id'), str) or not implementation['implementation_id']:
            issues.append(ValidationIssue(path=str(result_path), message='implementation_id must be a non-empty string'))
        if not isinstance(implementation.get('implementation_version'), str) or not implementation['implementation_version']:
            issues.append(ValidationIssue(path=str(result_path), message='implementation_version must be a non-empty string'))
        metadata = implementation.get('metadata')
        if metadata is not None and not isinstance(metadata, dict):
            issues.append(ValidationIssue(path=str(result_path), message='implementation metadata must be a JSON object'))
        extra_impl_keys = sorted(set(implementation) - {'implementation_id', 'implementation_version', 'metadata'})
        if extra_impl_keys:
            issues.append(
                ValidationIssue(
                    path=str(result_path),
                    message=f'implementation contains unsupported keys: {", ".join(extra_impl_keys)}',
                )
            )

    if not _validate_date_time(payload.get('executed_at')):
        issues.append(ValidationIssue(path=str(result_path), message='executed_at must be an RFC3339 date-time string'))

    scopes = payload.get('scopes')
    if not _validate_non_empty_string_list(scopes):
        issues.append(ValidationIssue(path=str(result_path), message='scopes must be a non-empty list of strings'))

    summary = payload.get('summary')
    if not isinstance(summary, dict):
        issues.append(ValidationIssue(path=str(result_path), message='summary must be a JSON object'))
    else:
        for key in ('pass', 'fail', 'skip', 'error', 'total'):
            if key not in summary:
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'summary is missing required key: {key}',
                    )
                )
            elif not isinstance(summary[key], int) or summary[key] < 0:
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'summary {key} must be a non-negative integer',
                    )
                )
        extra_summary_keys = sorted(set(summary) - {'pass', 'fail', 'skip', 'error', 'total'})
        if extra_summary_keys:
            issues.append(
                ValidationIssue(
                    path=str(result_path),
                    message=f'summary contains unsupported keys: {", ".join(extra_summary_keys)}',
                )
            )

    scenarios = payload.get('scenarios')
    if not isinstance(scenarios, list):
        issues.append(ValidationIssue(path=str(result_path), message='scenarios must be a list'))
    else:
        for scenario in scenarios:
            _validate_result_scenario(scenario, issues, str(result_path))
            if not isinstance(scenario, dict):
                continue
            scope = scenario.get('scope')
            scenario_id = scenario.get('scenario_id')
            coverage = scenario.get('coverage')
            if isinstance(scope, str) and scope and known_scopes and scope not in known_scopes:
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'result scenario references unknown scope: {scope}',
                    )
                )
            if (
                isinstance(scope, str)
                and scope
                and isinstance(scenario_id, str)
                and scenario_id
                and scope in known_scenarios_by_scope
                and scenario_id not in known_scenarios_by_scope[scope]
            ):
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'result scenario is not present in fixture pack for {scope}: {scenario_id}',
                    )
                )
            if isinstance(coverage, list) and allowed_coverage_levels:
                for coverage_level in coverage:
                    if isinstance(coverage_level, str) and coverage_level not in allowed_coverage_levels:
                        issues.append(
                            ValidationIssue(
                                path=str(result_path),
                                message=f'result scenario uses unknown coverage level: {coverage_level}',
                            )
                        )

    if isinstance(summary, dict) and isinstance(scenarios, list):
        total = summary.get('total')
        if isinstance(total, int) and total != len(scenarios):
            issues.append(
                ValidationIssue(
                    path=str(result_path),
                    message='summary total must match number of scenarios',
                )
            )
        counted_keys = ('pass', 'fail', 'skip', 'error')
        if all(isinstance(summary.get(key), int) for key in counted_keys) and isinstance(total, int):
            counted_total = sum(summary[key] for key in counted_keys)
            if counted_total != total:
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message='summary counts must add up to summary total',
                    )
                )

    return ResultValidationReport(
        result_path=result_path,
        repo_root=repo_root,
        result_schema_path=result_schema_path,
        issues=tuple(issues),
    )


def validate_compatibility_declaration_file(
    repo_root: Path | None = None,
    declaration_path: Path | None = None,
    declaration_schema_path: Path | None = None,
) -> DeclarationValidationReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    declaration_schema_path = (
        declaration_schema_path or repo_root / COMPATIBILITY_DECLARATION_SCHEMA_RELATIVE_PATH
    ).resolve()
    declaration_path = (
        declaration_path or repo_root / 'conformance/results/examples/compatibility-declaration-all-scopes.v1.json'
    ).resolve()
    issues: list[ValidationIssue] = []

    if not declaration_schema_path.exists():
        issues.append(
            ValidationIssue(
                path=str(declaration_schema_path),
                message='compatibility declaration schema does not exist',
            )
        )

    if not declaration_path.exists():
        issues.append(
            ValidationIssue(
                path=str(declaration_path),
                message='compatibility declaration file does not exist',
            )
        )
        return DeclarationValidationReport(
            declaration_path=declaration_path,
            repo_root=repo_root,
            declaration_schema_path=declaration_schema_path,
            issues=tuple(issues),
        )

    try:
        payload = load_json_file(declaration_path)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        issues.append(
            ValidationIssue(
                path=str(declaration_path),
                message=f'invalid JSON compatibility declaration file: {error}',
            )
        )
        return DeclarationValidationReport(
            declaration_path=declaration_path,
            repo_root=repo_root,
            declaration_schema_path=declaration_schema_path,
            issues=tuple(issues),
        )

    required_keys = (
        'declaration_schema_version',
        'manifest_id',
        'suite_version',
        'generated_at',
        'source_result',
        'implementation',
        'selected_scopes',
        'summary',
        'scope_declarations',
    )
    for key in required_keys:
        if key not in payload:
            issues.append(
                ValidationIssue(
                    path=str(declaration_path),
                    message=f'compatibility declaration is missing required key: {key}',
                )
            )

    extra_top_level_keys = sorted(set(payload) - (set(required_keys) | {'issues'}))
    if extra_top_level_keys:
        issues.append(
            ValidationIssue(
                path=str(declaration_path),
                message=f'compatibility declaration contains unsupported keys: {", ".join(extra_top_level_keys)}',
            )
        )

    if payload.get('declaration_schema_version') != '1.0':
        issues.append(ValidationIssue(path=str(declaration_path), message='declaration_schema_version must be 1.0'))
    if not isinstance(payload.get('manifest_id'), str) or not payload['manifest_id']:
        issues.append(ValidationIssue(path=str(declaration_path), message='manifest_id must be a non-empty string'))
    if not isinstance(payload.get('suite_version'), str):
        issues.append(ValidationIssue(path=str(declaration_path), message='suite_version must be a string'))
    if not _validate_date_time(payload.get('generated_at')):
        issues.append(ValidationIssue(path=str(declaration_path), message='generated_at must be an RFC3339 date-time string'))

    source_result = payload.get('source_result')
    if not isinstance(source_result, dict):
        issues.append(ValidationIssue(path=str(declaration_path), message='source_result must be a JSON object'))
    else:
        for key in ('result_path', 'runner_id', 'executed_at'):
            if key not in source_result:
                issues.append(
                    ValidationIssue(
                        path=str(declaration_path),
                        message=f'source_result is missing required key: {key}',
                    )
                )

    implementation = payload.get('implementation')
    if not isinstance(implementation, dict):
        issues.append(ValidationIssue(path=str(declaration_path), message='implementation must be a JSON object'))

    selected_scopes = payload.get('selected_scopes')
    if not isinstance(selected_scopes, list) or not all(isinstance(item, str) for item in selected_scopes):
        issues.append(ValidationIssue(path=str(declaration_path), message='selected_scopes must be a list of strings'))

    summary = payload.get('summary')
    if not isinstance(summary, dict):
        issues.append(ValidationIssue(path=str(declaration_path), message='summary must be a JSON object'))
    else:
        for key in ('compatible', 'partial', 'incompatible', 'not_evaluated', 'total'):
            if key not in summary:
                issues.append(
                    ValidationIssue(
                        path=str(declaration_path),
                        message=f'summary is missing required key: {key}',
                    )
                )
            elif not isinstance(summary[key], int) or summary[key] < 0:
                issues.append(
                    ValidationIssue(
                        path=str(declaration_path),
                        message=f'summary {key} must be a non-negative integer',
                    )
                )

    scope_declarations = payload.get('scope_declarations')
    if not isinstance(scope_declarations, list):
        issues.append(ValidationIssue(path=str(declaration_path), message='scope_declarations must be a list'))
    else:
        allowed_statuses = {'compatible', 'partial', 'incompatible', 'not_evaluated'}
        for declaration in scope_declarations:
            if not isinstance(declaration, dict):
                issues.append(
                    ValidationIssue(
                        path=str(declaration_path),
                        message='scope_declarations entries must be JSON objects',
                    )
                )
                continue
            required_scope_keys = (
                'scope',
                'status',
                'selected_in_result',
                'known_scenarios',
                'evaluated_scenarios',
                'pass',
                'fail',
                'skip',
                'error',
                'coverage_observed',
                'known_scenario_ids',
                'evaluated_scenario_ids',
            )
            for key in required_scope_keys:
                if key not in declaration:
                    issues.append(
                        ValidationIssue(
                            path=str(declaration_path),
                            message=f'scope declaration is missing required key: {key}',
                        )
                    )
            if declaration.get('status') not in allowed_statuses:
                issues.append(
                    ValidationIssue(
                        path=str(declaration_path),
                        message='scope declaration status must be compatible, partial, incompatible, or not_evaluated',
                    )
                )

    return DeclarationValidationReport(
        declaration_path=declaration_path,
        repo_root=repo_root,
        declaration_schema_path=declaration_schema_path,
        issues=tuple(issues),
    )


def build_compatibility_declaration(
    repo_root: Path | None = None,
    result_path: Path | None = None,
    manifest_path: Path | None = None,
    compatibility_schema_path: Path | None = None,
) -> CompatibilityDeclarationReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    result_path = (result_path or repo_root / 'conformance/results/example-result.v1.json').resolve()
    manifest_path = (manifest_path or repo_root / MANIFEST_RELATIVE_PATH).resolve()
    compatibility_schema_path = (
        compatibility_schema_path or repo_root / COMPATIBILITY_DECLARATION_SCHEMA_RELATIVE_PATH
    ).resolve()
    issues: list[ValidationIssue] = []

    result_validation = validate_result_file(repo_root=repo_root, result_path=result_path)
    issues.extend(result_validation.issues)

    manifest: ConformanceManifest | None = None
    if manifest_path.exists():
        try:
            manifest = ConformanceManifest.from_json(load_json_file(manifest_path))
        except (OSError, ValueError, json.JSONDecodeError) as error:
            issues.append(
                ValidationIssue(
                    path=str(manifest_path),
                    message=f'invalid conformance manifest: {error}',
                )
            )
    else:
        issues.append(
            ValidationIssue(
                path=str(manifest_path),
                message='conformance manifest does not exist',
            )
        )

    implementation: dict[str, Any] = {}
    runner_id = ''
    result_executed_at = ''
    selected_scopes: tuple[str, ...] = tuple()
    payload: dict[str, Any] = {}
    if result_path.exists():
        try:
            payload = load_json_file(result_path)
            implementation = payload.get('implementation', {}) if isinstance(payload.get('implementation'), dict) else {}
            runner_id = str(payload.get('runner_id', ''))
            result_executed_at = str(payload.get('executed_at', ''))
            selected_scopes_raw = payload.get('scopes', [])
            if isinstance(selected_scopes_raw, list):
                selected_scopes = tuple(str(scope) for scope in selected_scopes_raw if str(scope))
        except (OSError, ValueError, json.JSONDecodeError) as error:
            issues.append(
                ValidationIssue(
                    path=str(result_path),
                    message=f'invalid JSON result file: {error}',
                )
            )

    if not compatibility_schema_path.exists():
        issues.append(
            ValidationIssue(
                path=str(compatibility_schema_path),
                message='compatibility declaration schema does not exist',
            )
        )

    if manifest is None or not payload:
        return CompatibilityDeclarationReport(
            result_path=result_path,
            repo_root=repo_root,
            manifest=manifest,
            implementation=implementation,
            runner_id=runner_id,
            result_executed_at=result_executed_at,
            selected_scopes=selected_scopes,
            scope_reports=tuple(),
            compatibility_schema_path=compatibility_schema_path,
            issues=tuple(issues),
        )

    fixture_scenarios_by_scope = _load_fixture_scenarios_by_scope(repo_root, manifest, issues)
    scope_order = tuple(fixture_scenarios_by_scope.keys())
    known_scenarios_by_scope = {
        scope: tuple(scenario.scenario_id for scenario in scenarios)
        for scope, scenarios in fixture_scenarios_by_scope.items()
    }

    result_scenarios_by_scope: dict[str, list[dict[str, Any]]] = {}
    scenarios = payload.get('scenarios', [])
    if isinstance(scenarios, list):
        for raw_scenario in scenarios:
            if not isinstance(raw_scenario, dict):
                continue
            scope = str(raw_scenario.get('scope', ''))
            scenario_id = str(raw_scenario.get('scenario_id', ''))
            if not scope or not scenario_id:
                continue
            if scope not in known_scenarios_by_scope:
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'result scenario references unknown scope: {scope}',
                    )
                )
                continue
            if scenario_id not in set(known_scenarios_by_scope[scope]):
                issues.append(
                    ValidationIssue(
                        path=str(result_path),
                        message=f'result scenario is not present in fixture pack for {scope}: {scenario_id}',
                    )
                )
            result_scenarios_by_scope.setdefault(scope, []).append(raw_scenario)

    scope_reports: list[CompatibilityScopeReport] = []
    for scope in scope_order:
        known_scenarios = known_scenarios_by_scope.get(scope, tuple())
        result_scope_scenarios = result_scenarios_by_scope.get(scope, [])
        coverage_observed = _unique_preserve_order(
            coverage_item
            for scenario in result_scope_scenarios
            for coverage_item in scenario.get('coverage', [])
            if isinstance(coverage_item, str) and coverage_item
        )
        evaluated_scenario_ids = _unique_preserve_order(
            str(scenario.get('scenario_id', ''))
            for scenario in result_scope_scenarios
            if isinstance(scenario.get('scenario_id', ''), str) and str(scenario.get('scenario_id', ''))
        )
        pass_count = sum(1 for scenario in result_scope_scenarios if scenario.get('outcome') == 'pass')
        fail_count = sum(1 for scenario in result_scope_scenarios if scenario.get('outcome') == 'fail')
        skip_count = sum(1 for scenario in result_scope_scenarios if scenario.get('outcome') == 'skip')
        error_count = sum(1 for scenario in result_scope_scenarios if scenario.get('outcome') == 'error')
        selected_in_result = scope in selected_scopes

        if fail_count or error_count:
            status = 'incompatible'
        elif pass_count == len(known_scenarios) and len(evaluated_scenario_ids) == len(known_scenarios) and skip_count == 0:
            status = 'compatible'
        elif pass_count == 0:
            status = 'not_evaluated'
        else:
            status = 'partial'

        scope_reports.append(
            CompatibilityScopeReport(
                scope=scope,
                status=status,
                selected_in_result=selected_in_result,
                known_scenarios=known_scenarios,
                evaluated_scenarios=evaluated_scenario_ids,
                coverage_observed=coverage_observed,
                pass_count=pass_count,
                fail_count=fail_count,
                skip_count=skip_count,
                error_count=error_count,
            )
        )

    unknown_selected_scopes = [scope for scope in selected_scopes if scope not in set(scope_order)]
    for scope in unknown_selected_scopes:
        issues.append(
            ValidationIssue(
                path=str(result_path),
                message=f'result scopes contains unknown scope: {scope}',
            )
        )

    return CompatibilityDeclarationReport(
        result_path=result_path,
        repo_root=repo_root,
        manifest=manifest,
        implementation=implementation,
        runner_id=runner_id,
        result_executed_at=result_executed_at,
        selected_scopes=selected_scopes,
        scope_reports=tuple(scope_reports),
        compatibility_schema_path=compatibility_schema_path,
        issues=tuple(issues),
    )


def _layer_summaries_from_scope_reports(scope_reports: Iterable[CompatibilityScopeReport]) -> tuple[dict[str, Any], ...]:
    grouped: dict[str, dict[str, int]] = {}
    for scope in scope_reports:
        layer = _scope_layer(scope.scope)
        counts = grouped.setdefault(
            layer,
            {'compatible': 0, 'partial': 0, 'incompatible': 0, 'not_evaluated': 0, 'total': 0},
        )
        counts['total'] += 1
        counts[scope.status] += 1
    return tuple(
        {'layer': layer, **counts}
        for layer, counts in sorted(grouped.items())
    )


def compare_result_files(
    repo_root: Path | None = None,
    left_result_path: Path | None = None,
    right_result_path: Path | None = None,
    manifest_path: Path | None = None,
) -> ComparisonReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    left_result_path = (left_result_path or repo_root / 'conformance/results/example-result.v1.json').resolve()
    right_result_path = (right_result_path or repo_root / 'conformance/results/examples/fixture-check-profile-mcp-partial.v1.json').resolve()
    manifest_path = (manifest_path or repo_root / MANIFEST_RELATIVE_PATH).resolve()

    left = build_compatibility_declaration(
        repo_root=repo_root,
        result_path=left_result_path,
        manifest_path=manifest_path,
    )
    right = build_compatibility_declaration(
        repo_root=repo_root,
        result_path=right_result_path,
        manifest_path=manifest_path,
    )

    left_by_scope = {scope.scope: scope for scope in left.scope_reports}
    right_by_scope = {scope.scope: scope for scope in right.scope_reports}
    all_scopes = sorted(set(left_by_scope) | set(right_by_scope))
    changed_scopes = tuple(
        ScopeComparison(
            scope=scope,
            before_status=left_by_scope.get(scope).status if scope in left_by_scope else 'not_present',
            after_status=right_by_scope.get(scope).status if scope in right_by_scope else 'not_present',
        )
        for scope in all_scopes
        if (left_by_scope.get(scope).status if scope in left_by_scope else 'not_present')
        != (right_by_scope.get(scope).status if scope in right_by_scope else 'not_present')
    )
    issues = tuple((*left.issues, *right.issues))
    return ComparisonReport(
        comparison_kind='result',
        left_path=left_result_path,
        right_path=right_result_path,
        repo_root=repo_root,
        changed_scopes=changed_scopes,
        layer_summaries=_layer_summaries_from_scope_reports(right.scope_reports),
        issues=issues,
    )


def compare_compatibility_declarations(
    repo_root: Path | None = None,
    left_declaration_path: Path | None = None,
    right_declaration_path: Path | None = None,
) -> ComparisonReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    left_declaration_path = (
        left_declaration_path or repo_root / 'conformance/results/examples/compatibility-declaration-all-scopes.v1.json'
    ).resolve()
    right_declaration_path = (
        right_declaration_path or repo_root / 'conformance/results/examples/compatibility-declaration-profile-mcp-partial.v1.json'
    ).resolve()

    left_validation = validate_compatibility_declaration_file(repo_root=repo_root, declaration_path=left_declaration_path)
    right_validation = validate_compatibility_declaration_file(repo_root=repo_root, declaration_path=right_declaration_path)

    left_payload = load_json_file(left_declaration_path) if left_declaration_path.exists() else {}
    right_payload = load_json_file(right_declaration_path) if right_declaration_path.exists() else {}
    left_scopes = {
        str(scope['scope']): str(scope['status'])
        for scope in left_payload.get('scope_declarations', [])
        if isinstance(scope, dict) and 'scope' in scope and 'status' in scope
    }
    right_scopes = {
        str(scope['scope']): str(scope['status'])
        for scope in right_payload.get('scope_declarations', [])
        if isinstance(scope, dict) and 'scope' in scope and 'status' in scope
    }
    all_scopes = sorted(set(left_scopes) | set(right_scopes))
    changed_scopes = tuple(
        ScopeComparison(
            scope=scope,
            before_status=left_scopes.get(scope, 'not_present'),
            after_status=right_scopes.get(scope, 'not_present'),
        )
        for scope in all_scopes
        if left_scopes.get(scope, 'not_present') != right_scopes.get(scope, 'not_present')
    )
    layer_summaries = tuple()
    if isinstance(right_payload.get('scope_declarations'), list):
        grouped: dict[str, dict[str, int]] = {}
        for scope in right_payload['scope_declarations']:
            if not isinstance(scope, dict):
                continue
            layer = _scope_layer(str(scope.get('scope', '')))
            counts = grouped.setdefault(
                layer,
                {'compatible': 0, 'partial': 0, 'incompatible': 0, 'not_evaluated': 0, 'total': 0},
            )
            status = str(scope.get('status', ''))
            counts['total'] += 1
            if status in counts:
                counts[status] += 1
        layer_summaries = tuple({'layer': layer, **counts} for layer, counts in sorted(grouped.items()))

    return ComparisonReport(
        comparison_kind='compatibility-declaration',
        left_path=left_declaration_path,
        right_path=right_declaration_path,
        repo_root=repo_root,
        changed_scopes=changed_scopes,
        layer_summaries=layer_summaries,
        issues=tuple((*left_validation.issues, *right_validation.issues)),
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


def inventory_repository(
    repo_root: Path | None = None,
    manifest_path: Path | None = None,
    requested_scopes: tuple[str, ...] | None = None,
) -> InventoryReport:
    repo_root = (repo_root or discover_repo_root()).resolve()
    manifest_path = (manifest_path or repo_root / MANIFEST_RELATIVE_PATH).resolve()
    issues: list[ValidationIssue] = []
    requested_scopes = tuple(requested_scopes or ())

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
            requested_scopes=requested_scopes,
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
            if requested_scopes and scope not in requested_scopes:
                continue
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

    if requested_scopes:
        available_scopes = {pack.scope for pack in packs}
        missing_scopes = [scope for scope in requested_scopes if scope not in available_scopes]
        for missing_scope in missing_scopes:
            issues.append(
                ValidationIssue(
                    path=str(manifest_path),
                    message=f"requested scope not found in fixture index: {missing_scope}",
                )
            )

    return InventoryReport(
        manifest_path=manifest_path,
        repo_root=repo_root,
        manifest=manifest,
        packs=tuple(packs),
        scenarios=tuple(scenarios),
        requested_scopes=requested_scopes,
        issues=tuple(issues),
    )
