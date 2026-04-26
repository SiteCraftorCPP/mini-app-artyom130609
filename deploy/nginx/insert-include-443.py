#!/usr/bin/env python3
"""
Вставка include artshopvirts-notify.conf в тот server {}, где:
  - есть listen с 443, и
  - в server_name встречается artshopvirts (без учёта регистра).

Порядок listen / server_name в блоке не важен. Идемпотентно.
"""
from __future__ import annotations

import os
import re
import shutil
import sys
import time
from pathlib import Path

INCLUDE = "    include /etc/nginx/snippets/artshopvirts-notify.conf;"

# бэкап в /var/…, не в sites-enabled
def _backup(path: Path) -> None:
    d = Path(os.environ.get("BACKUP_DIR", "/var/backups/nginx-artshopvirts"))
    d.mkdir(parents=True, exist_ok=True)
    dst = d / f"{path.name}.{time.strftime('%Y%m%d%H%M%S')}.bak"
    shutil.copy2(path, dst)
    print(f"бэкап: {dst}")


def _is_listen_443_line(line: str) -> bool:
    s = line.split("#", 1)[0].strip()
    if not s.startswith("listen") or "443" not in s:
        return False
    return True


def _iter_server_block_ranges(lines: list[str]) -> list[tuple[int, int]]:
    """Индексы (start, end) включительно по строкам, для каждого top-level `server { ... }`."""
    n = len(lines)
    out: list[tuple[int, int]] = []
    i = 0
    while i < n:
        s0 = lines[i].split("#", 1)[0].strip()
        if not re.match(r"^server\s*\{", s0):
            i += 1
            continue
        depth = 0
        for k in range(i, n):
            p = lines[k].split("#", 1)[0]
            depth += p.count("{") - p.count("}")
            if k >= i and depth == 0:
                out.append((i, k))
                i = k + 1
                break
        else:
            i += 1
    return out


def _server_name_line_with_domain(block: list[str], start_global: int) -> int | None:
    for j, line in enumerate(block):
        head = line.split("#", 1)[0]
        if re.search(r"(?i)server_name\s+[^#;]*artshopvirts", head):
            return start_global + j
    return None


def _block_satisfied(block: list[str]) -> bool:
    has_443 = any(_is_listen_443_line(l) for l in block)
    has_dom = any(
        re.search(r"(?i)server_name\s+[^#;]*artshopvirts", l.split("#", 1)[0]) for l in block
    )
    return has_443 and has_dom


def _block_has_include(block: list[str]) -> bool:
    return "artshopvirts-notify" in "\n".join(block)


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: insert-include-443.py /path/to/artshopvirts.space", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"not found: {path}", file=sys.stderr)
        return 1

    raw = path.read_text(encoding="utf-8", errors="replace")
    if not raw.endswith("\n"):
        raw = raw + "\n"
    lines = raw.splitlines()

    ranges = _iter_server_block_ranges(lines)
    if not ranges:
        print("в файле нет ни одного server { } — проверьте путь к конфигу", file=sys.stderr)
        return 1

    for start, end in ranges:
        block = lines[start : end + 1]
        if not _block_satisfied(block):
            continue
        if _block_has_include(block):
            print("include уже в server-блоке с listen 443 и artshopvirts — без изменений")
            return 0
        ins_after = _server_name_line_with_domain(block, start)
        if ins_after is None:
            continue
        w = "\n".join(lines[ins_after : min(ins_after + 18, len(lines))])
        if "artshopvirts-notify" in w:
            print("include уже в server с listen 443 — без изменений")
            return 0
        _backup(path)
        new_lines = lines[: ins_after + 1] + [INCLUDE] + lines[ins_after + 1 :]
        path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        print("добавлен include в server (listen 443 + artshopvirts, после server_name)")
        return 0

    print(
        "не найден server { } с (listen 443) и (server_name … artshopvirts); "
        "проверьте имя в server_name (регистр не важен) или вставьте include вручную.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
