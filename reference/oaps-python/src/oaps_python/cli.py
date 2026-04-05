from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .manifest import (
    MANIFEST_RELATIVE_PATH,
    CompatibilityDeclarationReport,
    FixtureCheckReport,
    InventoryReport,
    ResultValidationReport,
    ValidationReport,
    build_compatibility_declaration,
    discover_repo_root,
    fixture_check_repository,
    inventory_repository,
    validate_result_file,
    validate_repository,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="oaps-python", description="OAPS Python interoperability starter")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate", help="validate the suite conformance manifest and referenced files")
    validate.add_argument("--repo-root", type=Path, default=None, help="repository root to inspect")
    validate.add_argument("--manifest", type=Path, default=None, help="override conformance manifest path")
    validate.add_argument("--json", action="store_true", help="emit machine-readable output")

    inventory = subparsers.add_parser("inventory", help="inventory fixture scopes and scenarios from the suite manifest")
    inventory.add_argument("--repo-root", type=Path, default=None, help="repository root to inspect")
    inventory.add_argument("--manifest", type=Path, default=None, help="override conformance manifest path")
    inventory.add_argument(
        "--scope",
        action="append",
        dest="scopes",
        default=None,
        help="limit inventory output to a specific fixture scope; can be repeated",
    )
    inventory.add_argument("--json", action="store_true", help="emit a schema-shaped dry-run result")
    inventory.add_argument(
        "--output",
        type=Path,
        default=None,
        help="write the inventory payload to a file instead of only stdout",
    )

    check = subparsers.add_parser(
        "check",
        aliases=["fixture-check"],
        help="run static fixture checks over selected scopes and scenarios",
    )
    check.add_argument("--repo-root", type=Path, default=None, help="repository root to inspect")
    check.add_argument("--manifest", type=Path, default=None, help="override conformance manifest path")
    check.add_argument(
        "--scope",
        action="append",
        dest="scopes",
        default=None,
        help="limit checks to a specific fixture scope; can be repeated",
    )
    check.add_argument(
        "--scenario",
        action="append",
        dest="scenarios",
        default=None,
        help="limit checks to specific fixture scenario ids; can be repeated",
    )
    check.add_argument("--json", action="store_true", help="emit a schema-shaped conformance result")
    check.add_argument(
        "--output",
        type=Path,
        default=None,
        help="write the check payload to a file instead of only stdout",
    )

    result = subparsers.add_parser(
        "validate-result",
        aliases=["result-validate"],
        help="validate a conformance result file against the suite result shape",
    )
    result.add_argument("--repo-root", type=Path, default=None, help="repository root to inspect")
    result.add_argument(
        "--result",
        type=Path,
        required=True,
        help="conformance result JSON file to validate",
    )
    result.add_argument("--json", action="store_true", help="emit machine-readable output")

    compatibility = subparsers.add_parser(
        "compatibility",
        aliases=["declare-compatibility"],
        help="summarize scope-level compatibility from a conformance result file",
    )
    compatibility.add_argument("--repo-root", type=Path, default=None, help="repository root to inspect")
    compatibility.add_argument(
        "--result",
        type=Path,
        required=True,
        help="conformance result JSON file to summarize",
    )
    compatibility.add_argument("--manifest", type=Path, default=None, help="override conformance manifest path")
    compatibility.add_argument("--json", action="store_true", help="emit a machine-readable compatibility declaration")
    compatibility.add_argument(
        "--output",
        type=Path,
        default=None,
        help="write the compatibility declaration to a file instead of only stdout",
    )
    return parser


def _print_report(report: ValidationReport, as_json: bool) -> int:
    if as_json:
        print(json.dumps(report.to_dict(), indent=2, sort_keys=True))
    else:
        if report.ok:
            print(f"OK: validated {report.manifest_path} from {report.repo_root}")
        else:
            print(f"FAILED: {report.manifest_path} from {report.repo_root}")
            for issue in report.issues:
                print(f"- {issue.path}: {issue.message}")
    return 0 if report.ok else 1


def _render_inventory(report: InventoryReport, as_json: bool) -> str:
    if as_json:
        return json.dumps(report.to_result_dict(), indent=2, sort_keys=True)

    lines = [
        f"Inventory report for {report.manifest_path}",
        f"- repo root: {report.repo_root}",
    ]
    if report.manifest is None:
        lines.append("- manifest: missing")
    else:
        lines.append(f"- manifest: {report.manifest.tck_id} ({report.manifest.suite_version})")
    if report.requested_scopes:
        lines.append(f"- requested scopes: {', '.join(report.requested_scopes)}")
    lines.extend(
        [
            f"- packs: {report.total_packs}",
            f"- scenarios: {report.total_scenarios}",
        ]
    )
    if report.scopes:
        lines.append(f"- scopes: {', '.join(report.scopes)}")
    if report.issues:
        lines.append("- issues:")
        for issue in report.issues:
            lines.append(f"  - {issue.path}: {issue.message}")
    lines.append("- note: inventory-only report; no pass/fail execution was performed")
    return "\n".join(lines)


def _print_inventory(report: InventoryReport, as_json: bool, output_path: Path | None = None) -> int:
    payload = _render_inventory(report, as_json)
    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(payload + "\n", encoding="utf-8")
        print(f"Wrote inventory report to {output_path}")
        return 0

    print(payload)
    return 0


def _render_check(report: FixtureCheckReport, as_json: bool) -> str:
    if as_json:
        return json.dumps(report.to_result_dict(), indent=2, sort_keys=True)

    lines = [
        f"Fixture check report for {report.manifest_path}",
        f"- repo root: {report.repo_root}",
    ]
    if report.manifest is None:
        lines.append("- manifest: missing")
    else:
        lines.append(f"- manifest: {report.manifest.tck_id} ({report.manifest.suite_version})")
    if report.requested_scopes:
        lines.append(f"- requested scopes: {', '.join(report.requested_scopes)}")
    if report.requested_scenarios:
        lines.append(f"- requested scenarios: {', '.join(report.requested_scenarios)}")
    lines.extend(
        [
            f"- checked scopes: {', '.join(report.scopes) if report.scopes else 'none'}",
            f"- scenarios: {report.total_scenarios}",
            f"- pass: {report.total_pass}",
            f"- fail: {report.total_fail}",
            f"- error: {report.total_error}",
        ]
    )
    if report.issues:
        lines.append("- issues:")
        for issue in report.issues:
            lines.append(f"  - {issue.path}: {issue.message}")
    lines.append("- note: static fixture check; no runtime execution was performed")
    return "\n".join(lines)


def _print_check(report: FixtureCheckReport, as_json: bool, output_path: Path | None = None) -> int:
    payload = _render_check(report, as_json)
    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(payload + "\n", encoding="utf-8")
        print(f"Wrote fixture check report to {output_path}")
        return 0 if report.ok else 1

    print(payload)
    return 0 if report.ok else 1


def _render_result_validation(report: ResultValidationReport, as_json: bool) -> str:
    if as_json:
        return json.dumps(report.to_dict(), indent=2, sort_keys=True)

    lines = [
        f"Result validation report for {report.result_path}",
        f"- repo root: {report.repo_root}",
        f"- result schema: {report.result_schema_path}",
        f"- status: {'ok' if report.ok else 'failed'}",
    ]
    if report.issues:
        lines.append("- issues:")
        for issue in report.issues:
            lines.append(f"  - {issue.path}: {issue.message}")
    else:
        lines.append("- note: result file matches the suite's pragmatic result shape")
    return "\n".join(lines)


def _print_result_validation(report: ResultValidationReport, as_json: bool) -> int:
    print(_render_result_validation(report, as_json))
    return 0 if report.ok else 1


def _render_compatibility(report: CompatibilityDeclarationReport, as_json: bool) -> str:
    if as_json:
        return json.dumps(report.to_dict(), indent=2, sort_keys=True)

    implementation_id = report.implementation.get('implementation_id', 'unknown')
    implementation_version = report.implementation.get('implementation_version', 'unknown')
    lines = [
        f"Compatibility declaration for {report.result_path}",
        f"- repo root: {report.repo_root}",
        f"- implementation: {implementation_id} ({implementation_version})",
        f"- runner: {report.runner_id or 'unknown'}",
        f"- result executed at: {report.result_executed_at or 'unknown'}",
        (
            f"- manifest: {report.manifest.tck_id} ({report.manifest.suite_version})"
            if report.manifest is not None
            else "- manifest: missing"
        ),
        f"- compatible scopes: {report.compatible_count}",
        f"- partial scopes: {report.partial_count}",
        f"- incompatible scopes: {report.incompatible_count}",
        f"- not evaluated scopes: {report.not_evaluated_count}",
    ]
    if report.selected_scopes:
        lines.append(f"- selected scopes in result: {', '.join(report.selected_scopes)}")
    lines.append("- scope declarations:")
    for scope in report.scope_reports:
        lines.append(
            "  - "
            f"{scope.scope}: {scope.status} "
            f"(pass={scope.pass_count}, fail={scope.fail_count}, skip={scope.skip_count}, error={scope.error_count}, "
            f"evaluated={scope.evaluated_scenario_count}/{scope.known_scenario_count})"
        )
    if report.issues:
        lines.append("- issues:")
        for issue in report.issues:
            lines.append(f"  - {issue.path}: {issue.message}")
    return "\n".join(lines)


def _print_compatibility(
    report: CompatibilityDeclarationReport,
    as_json: bool,
    output_path: Path | None = None,
) -> int:
    payload = _render_compatibility(report, as_json)
    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(payload + "\n", encoding="utf-8")
        print(f"Wrote compatibility declaration to {output_path}")
        return 0 if report.ok else 1

    print(payload)
    return 0 if report.ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "validate":
        repo_root = discover_repo_root(args.repo_root or Path.cwd())
        manifest_path = args.manifest or (repo_root / MANIFEST_RELATIVE_PATH)
        report = validate_repository(repo_root=repo_root, manifest_path=manifest_path)
        return _print_report(report, args.json)

    if args.command == "inventory":
        repo_root = discover_repo_root(args.repo_root or Path.cwd())
        manifest_path = args.manifest or (repo_root / MANIFEST_RELATIVE_PATH)
        report = inventory_repository(
            repo_root=repo_root,
            manifest_path=manifest_path,
            requested_scopes=tuple(args.scopes or ()),
        )
        return _print_inventory(report, args.json, args.output)

    if args.command in {"check", "fixture-check"}:
        repo_root = discover_repo_root(args.repo_root or Path.cwd())
        manifest_path = args.manifest or (repo_root / MANIFEST_RELATIVE_PATH)
        report = fixture_check_repository(
            repo_root=repo_root,
            manifest_path=manifest_path,
            requested_scopes=tuple(args.scopes or ()),
            requested_scenarios=tuple(args.scenarios or ()),
        )
        return _print_check(report, args.json, args.output)

    if args.command in {"validate-result", "result-validate"}:
        repo_root = discover_repo_root(args.repo_root or Path.cwd())
        report = validate_result_file(repo_root=repo_root, result_path=args.result)
        return _print_result_validation(report, args.json)

    if args.command in {"compatibility", "declare-compatibility"}:
        repo_root = discover_repo_root(args.repo_root or Path.cwd())
        manifest_path = args.manifest or (repo_root / MANIFEST_RELATIVE_PATH)
        report = build_compatibility_declaration(
            repo_root=repo_root,
            result_path=args.result,
            manifest_path=manifest_path,
        )
        return _print_compatibility(report, args.json, args.output)

    parser.error("unknown command")
    return 2


if __name__ == "__main__":
    sys.exit(main())
