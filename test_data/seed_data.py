#!/usr/bin/env python3
from __future__ import annotations

import argparse
import logging
import os
import re
import socket
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

POST_SUCCESS_RE = re.compile(r"\bPost\s+\d+/\d+\s+by\s+.+:\s+id=")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
POST_SERVICE_URL = os.getenv("POST_SERVICE_URL", "http://localhost:8002")


@dataclass
class RunStats:
    generators_run: int = 0
    generators_failed: int = 0
    backend_processed_posts: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Single entrypoint for all test data generators. "
            "Runs every generate_*.py file and streams logs."
        )
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Run generators even if preflight checks show backend services as unreachable.",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop immediately if any generator exits with non-zero status.",
    )
    parser.add_argument(
        "--match",
        metavar="SUBSTRING",
        help="Run only generators whose filename contains this substring.",
    )
    return parser.parse_args()


def discover_generators(base_dir: Path, match: str | None = None) -> list[Path]:
    generators = sorted(path for path in base_dir.glob("generate_*.py") if path.is_file())
    if match:
        generators = [path for path in generators if match in path.name]
    return generators


def service_is_reachable(url: str, timeout_seconds: float = 1.5) -> bool:
    parsed = urlparse(url)
    if not parsed.hostname:
        return False

    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80

    try:
        with socket.create_connection((parsed.hostname, port), timeout=timeout_seconds):
            return True
    except OSError:
        return False


def stream_generator_output(script_path: Path, stats: RunStats) -> tuple[int, int]:
    # Force UTF-8 in child generators so Cyrillic logs are decoded correctly.
    cmd = [sys.executable, "-X", "utf8", "-u", str(script_path)]
    script_processed_posts = 0
    child_env = os.environ.copy()
    child_env["PYTHONUTF8"] = "1"
    child_env["PYTHONIOENCODING"] = "utf-8"

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=str(script_path.parent.parent),
            env=child_env,
        )
    except OSError as exc:
        logging.error("Cannot start %s: %s", script_path.name, exc)
        return 1, 0

    assert process.stdout is not None
    for line in process.stdout:
        sys.stdout.write(line)
        sys.stdout.flush()

        if POST_SUCCESS_RE.search(line):
            script_processed_posts += 1
            stats.backend_processed_posts += 1
            logging.info("Backend processed posts: %d", stats.backend_processed_posts)

    return_code = process.wait()
    return return_code, script_processed_posts


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    base_dir = Path(__file__).resolve().parent
    generators = discover_generators(base_dir, match=args.match)

    if not generators:
        logging.error("No generator files found in %s", base_dir)
        return 1

    auth_reachable = service_is_reachable(AUTH_SERVICE_URL)
    post_reachable = service_is_reachable(POST_SERVICE_URL)

    if not auth_reachable or not post_reachable:
        logging.warning(
            "Service check: AUTH_SERVICE_URL=%s (%s), POST_SERVICE_URL=%s (%s)",
            AUTH_SERVICE_URL,
            "up" if auth_reachable else "down",
            POST_SERVICE_URL,
            "up" if post_reachable else "down",
        )
        if not args.force:
            logging.warning("Backend looks offline. Skip run. Use --force to run anyway.")
            logging.info("Backend processed posts: 0")
            return 0

    stats = RunStats()
    total = len(generators)

    for index, generator in enumerate(generators, start=1):
        logging.info("Run generator %d/%d: %s", index, total, generator.name)
        return_code, script_processed_posts = stream_generator_output(generator, stats)

        stats.generators_run += 1
        if return_code != 0:
            stats.generators_failed += 1
            logging.warning(
                "Generator failed: %s (exit_code=%d)",
                generator.name,
                return_code,
            )
            if args.fail_fast:
                break
        else:
            logging.info(
                "Generator done: %s | script backend posts: %d | total backend posts: %d",
                generator.name,
                script_processed_posts,
                stats.backend_processed_posts,
            )

    logging.info(
        "Summary: generators run=%d/%d, failed=%d, backend processed posts=%d",
        stats.generators_run,
        total,
        stats.generators_failed,
        stats.backend_processed_posts,
    )

    return 1 if stats.generators_failed > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
