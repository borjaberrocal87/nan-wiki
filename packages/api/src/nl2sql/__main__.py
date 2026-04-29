from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys

from src.nl2sql.pipeline import answer, shutdown_pool


def main() -> None:
    parser = argparse.ArgumentParser(description="NL2SQL: natural language to SQL pipeline")
    parser.add_argument("question", help="The question to answer")
    parser.add_argument("--debug", action="store_true", help="Show SQL, rows and timings")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    result = asyncio.run(answer(args.question))

    print(f"\nQuestion: {result.question}")
    print(f"\nAnswer: {result.answer}")

    if args.debug:
        print(f"\n--- Debug ---")
        print(f"SQL: {result.sql or 'N/A'}")
        print(f"Assumptions: {result.assumptions or 'None'}")
        print(f"Rows: {len(result.rows) if result.rows else 0} (count: {result.row_count}, truncated: {result.truncated})")
        if result.rows:
            print(json.dumps(result.rows[:5], default=str, indent=2))
            if len(result.rows) > 5:
                print(f"... and {len(result.rows) - 5} more rows")
        print(f"Timings: {json.dumps({k: f'{v:.3f}s' for k, v in result.timings.items()})}")

    if result.error:
        print(f"\nError: {result.error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
