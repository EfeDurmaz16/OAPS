from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .manifest import (
    MANIFEST_RELATIVE_PATH,
    InventoryReport,
    ValidationReport,
    discover_repo_root,
    inventory_repository,
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
    inventory.add_argument("--json", action="store_true", help="emit a schema-shaped dry-run result")
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


def _print_inventory(report: InventoryReport, as_json: bool) -> int:
    if as_json:
        print(json.dumps(report.to_result_dict(), indent=2, sort_keys=True))
        return 0

    print(f"Inventory report for {report.manifest_path}")
    print(f"- repo root: {report.repo_root}")
    if report.manifest is None:
        print("- manifest: missing")
    else:
        print(f"- manifest: {report.manifest.tck_id} ({report.manifest.suite_version})")
    print(f"- packs: {report.total_packs}")
    print(f"- scenarios: {report.total_scenarios}")
    if report.scopes:
        print(f"- scopes: {', '.join(report.scopes)}")
    if report.issues:
        print("- issues:")
        for issue in report.issues:
            print(f"  - {issue.path}: {issue.message}")
    print("- note: inventory-only report; no pass/fail execution was performed")
    return 0


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
        report = inventory_repository(repo_root=repo_root, manifest_path=manifest_path)
        return _print_inventory(report, args.json)

    parser.error("unknown command")
    return 2


if __name__ == "__main__":
    sys.exit(main())
