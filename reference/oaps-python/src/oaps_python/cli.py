from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .manifest import MANIFEST_RELATIVE_PATH, ValidationReport, discover_repo_root, validate_repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="oaps-python", description="OAPS Python interoperability starter")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate", help="validate the suite conformance manifest and referenced files")
    validate.add_argument("--repo-root", type=Path, default=None, help="repository root to inspect")
    validate.add_argument("--manifest", type=Path, default=None, help="override conformance manifest path")
    validate.add_argument("--json", action="store_true", help="emit machine-readable output")
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


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "validate":
        repo_root = discover_repo_root(args.repo_root or Path.cwd())
        manifest_path = args.manifest or (repo_root / MANIFEST_RELATIVE_PATH)
        report = validate_repository(repo_root=repo_root, manifest_path=manifest_path)
        return _print_report(report, args.json)

    parser.error("unknown command")
    return 2


if __name__ == "__main__":
    sys.exit(main())
