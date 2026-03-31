#!/usr/bin/env python3
"""Validate generated HTML structure, JSON-LD, and internal links in dist/."""

import json
import re
import sys
from pathlib import Path

DIST_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "dist")

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


def main() -> None:
    if not DIST_DIR.exists():
        print(f"Error: {DIST_DIR} not found. Run build first.")
        sys.exit(1)

    html_files = sorted(DIST_DIR.rglob("*.html"))
    print(f"\n{GREEN}=== HTML Structure Check ==={NC}")
    print(f"  Scanning {len(html_files)} HTML files...")

    multi_h1 = 0
    missing_lang = 0
    missing_alt_total = 0

    for file in html_files:
        rel = str(file.relative_to(DIST_DIR))
        content = file.read_text(encoding="utf-8", errors="replace")

        # Multiple <h1>
        h1_count = len(re.findall(r"<h1[\s>]", content))
        if h1_count > 1:
            log_error(f"{rel}: {h1_count} <h1> tags (expected 1)")
            multi_h1 += 1

        # <html lang="">
        if not re.search(r"<html[^>]*\slang=", content):
            log_error(f"{rel}: Missing lang attribute on <html>")
            missing_lang += 1

        # <img> without alt
        imgs_without_alt = len(re.findall(r"<img(?![^>]*\salt=)[^>]*>", content))
        if imgs_without_alt > 0:
            log_warn(f"{rel}: {imgs_without_alt} <img> without alt")
            missing_alt_total += imgs_without_alt

    if multi_h1 == 0:
        log_ok("All pages have single <h1>")
    if missing_lang == 0:
        log_ok("All pages have lang attribute")
    if missing_alt_total > 0:
        log_warn(f"{missing_alt_total} images without alt text total")

    # --- JSON-LD Validation ---
    print(f"\n{GREEN}=== JSON-LD Validation ==={NC}")

    jsonld_pages = 0
    jsonld_errors = 0

    for file in html_files:
        rel = str(file.relative_to(DIST_DIR))
        content = file.read_text(encoding="utf-8", errors="replace")

        blocks = re.findall(
            r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL
        )
        if blocks:
            jsonld_pages += 1
            for block in blocks:
                try:
                    json.loads(block)
                except json.JSONDecodeError as e:
                    log_error(f"{rel}: Invalid JSON-LD — {e}")
                    jsonld_errors += 1

    log_ok(f"Found JSON-LD in {jsonld_pages} pages")
    if jsonld_errors == 0:
        log_ok("All JSON-LD schemas are valid JSON")

    # --- Internal Links Check ---
    print(f"\n{GREEN}=== Internal Links Check ==={NC}")

    broken = 0
    checked = 0

    for file in html_files:
        rel = str(file.relative_to(DIST_DIR))
        content = file.read_text(encoding="utf-8", errors="replace")

        links = set(re.findall(r'href="(/[^"#]*)"', content))
        for link in sorted(links):
            checked += 1
            local_path = DIST_DIR / link.lstrip("/")

            # Check: exact file, directory with index.html, or path/index.html
            if local_path.is_file():
                continue
            if local_path.is_dir() and (local_path / "index.html").exists():
                continue
            index_path = Path(str(local_path).rstrip("/")) / "index.html"
            if index_path.exists():
                continue

            log_error(f"{rel}: Broken link → {link}")
            broken += 1

    if broken == 0:
        log_ok(f"All {checked} internal links valid")

    # --- Summary ---
    print(f"\n{GREEN}=== Summary ==={NC}")
    print(f"  Errors:   {errors}")
    print(f"  Warnings: {warnings}")
    if errors > 0:
        print(f"\n{RED}HTML validation failed with {errors} error(s){NC}")
        sys.exit(1)
    else:
        print(f"\n{GREEN}All HTML checks passed{NC}")


if __name__ == "__main__":
    main()
