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

    parser.error("unknown command")
    return 2


if __name__ == "__main__":
    sys.exit(main())
