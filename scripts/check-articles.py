#!/usr/bin/env python3
"""Validate blog article frontmatter and FR/EN parity."""

import sys
import re
from pathlib import Path

POSTS_DIR = Path("src/content/posts")
REQUIRED_FIELDS = {"title", "date"}
RECOMMENDED_FIELDS = {"description", "tags", "categories", "image"}
FORBIDDEN_FIELDS = {"slug"}

errors = 0
warnings = 0

RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[0;33m"
NC = "\033[0m"


def log_error(msg: str) -> None:
    global errors
    print(f"  {RED}✗{NC} {msg}")
    errors += 1


def log_warn(msg: str) -> None:
    global warnings
    print(f"  {YELLOW}!{NC} {msg}")
    warnings += 1


def log_ok(msg: str) -> None:
    print(f"  {GREEN}✓{NC} {msg}")


def parse_frontmatter(file_path: Path) -> dict[str, str] | None:
    """Extract frontmatter as a dict of field -> raw value."""
    text = file_path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return None
    fm = {}
    for line in match.group(1).splitlines():
        # Top-level field (not indented, not a list item)
        m = re.match(r"^(\w[\w-]*):\s*(.*)", line)
        if m:
            fm[m.group(1)] = m.group(2).strip().strip("\"'")
    return fm


def check_frontmatter(file_path: Path, rel: str) -> None:
    fm = parse_frontmatter(file_path)
    if fm is None:
        log_error(f"{rel}: No frontmatter found")
        return

    # Required fields
    for field in REQUIRED_FIELDS:
        if field not in fm:
            log_error(f"{rel}: Missing required field '{field}'")

    # Recommended fields
    for field in RECOMMENDED_FIELDS:
        if field not in fm:
            log_warn(f"{rel}: Missing recommended field '{field}'")

    # Forbidden fields
    for field in FORBIDDEN_FIELDS:
        if field in fm:
            log_error(f"{rel}: Contains '{field}' field — causes duplicate IDs in Astro v5")

    # Date format
    if "date" in fm:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", fm["date"]):
            log_error(f"{rel}: Date should be YYYY-MM-DD, got '{fm['date']}'")

    # Image path and existence
    if "image" in fm and fm["image"]:
        image_val = fm["image"]
        if not image_val.startswith("/images/posts/"):
            log_warn(f"{rel}: Image path should start with /images/posts/")
        image_path = Path("public") / image_val.lstrip("/")
        if not image_path.exists():
            log_error(f"{rel}: Image file not found: {image_path}")


def main() -> None:
    global errors

    fr_dir = POSTS_DIR / "fr"
    en_dir = POSTS_DIR / "en"

    fr_files = sorted(f.name for f in fr_dir.glob("*.md")) if fr_dir.exists() else []
    en_files = sorted(f.name for f in en_dir.glob("*.md")) if en_dir.exists() else []

    # --- FR/EN Parity ---
    print(f"\n{GREEN}=== FR/EN Parity Check ==={NC}")
    parity_ok = True
    for f in fr_files:
        if f not in en_files:
            log_error(f"Missing EN version: en/{f}")
            parity_ok = False
    for f in en_files:
        if f not in fr_files:
            log_error(f"Missing FR version: fr/{f}")
            parity_ok = False
    if parity_ok:
        log_ok("All articles have both FR and EN versions")

    # --- Frontmatter Validation ---
    print(f"\n{GREEN}=== Frontmatter Validation ==={NC}")
    for f in fr_files:
        check_frontmatter(fr_dir / f, f"fr/{f}")
    for f in en_files:
        check_frontmatter(en_dir / f, f"en/{f}")

    # --- Title Parity ---
    print(f"\n{GREEN}=== Title Parity Check ==={NC}")
    title_ok = True
    for f in fr_files:
        if f in en_files:
            fr_fm = parse_frontmatter(fr_dir / f)
            en_fm = parse_frontmatter(en_dir / f)
            if fr_fm and not fr_fm.get("title"):
                log_error(f"fr/{f}: Missing title")
                title_ok = False
            if en_fm and not en_fm.get("title"):
                log_error(f"en/{f}: Missing title")
                title_ok = False
    if title_ok:
        log_ok("All articles have titles in both versions")

    # --- Summary ---
    print(f"\n{GREEN}=== Summary ==={NC}")
    print(f"  Errors:   {errors}")
    print(f"  Warnings: {warnings}")
    if errors > 0:
        print(f"\n{RED}Article validation failed with {errors} error(s){NC}")
        sys.exit(1)
    else:
        print(f"\n{GREEN}All article checks passed{NC}")


if __name__ == "__main__":
    main()
