from __future__ import annotations

import json
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
class ConformanceManifest:
    manifest_version: str
    tck_id: str
    suite_version: str
    status: str
    entrypoints: tuple[dict[str, Any], ...]
    taxonomy: str
    fixture_index: str
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
