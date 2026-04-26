#!/usr/bin/env python3
"""
Вставка include artshopvirts-notify.conf в тот server {}, где listen 443 и artshopvirts в server_name.
Идемпотентно (не дублирует include рядом с server_name).
"""
from __future__ import annotations

import os
import re
import shutil
import sys
import time
from pathlib import Path

INCLUDE = "    include /etc/nginx/snippets/artshopvirts-notify.conf;"

# Бэкап не в sites-enabled/ (только /var/…)
def _backup(path: Path) -> None:
    d = Path(os.environ.get("BACKUP_DIR", "/var/backups/nginx-artshopvirts"))
    d.mkdir(parents=True, exist_ok=True)
    dst = d / f"{path.name}.{time.strftime('%Y%m%d%H%M%S')}.bak"
    shutil.copy2(path, dst)
    print(f"бэкап: {dst}")


def _is_listen_443_line(line: str) -> bool:
    s = line.split("#", 1)[0].strip()
    return s.startswith("listen") and "443" in s


def _new_vhost_start(line: str) -> bool:
    s = line.lstrip()
    if s.startswith("#"):
        return False
    return bool(re.match(r"^server\s*\{", s))


def _is_target_server_name(line: str) -> bool:
    s = line.split("#", 1)[0]
    return bool(re.search(r"server_name\s+.*artshopvirts", s))


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

    for i, line in enumerate(lines):
        if not _is_listen_443_line(line):
            continue
        for k in range(i + 1, min(i + 1 + 120, len(lines))):
            if _new_vhost_start(lines[k]) and k > i + 1:
                break
            if not _is_target_server_name(lines[k]):
                continue
            w = "\n".join(lines[k : min(k + 18, len(lines))])
            if "artshopvirts-notify" in w:
                print("include уже в server с listen 443 — без изменений")
                return 0
            _backup(path)
            new_lines = lines[: k + 1] + [INCLUDE] + lines[k + 1 :]
            path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            print("добавлен include в server с listen 443 (после server_name + artshopvirts)")
            return 0

    print(
        "не найдена пара: listen 443 + server_name с artshopvirts в одном vhost; правьте конфиг вручную",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
