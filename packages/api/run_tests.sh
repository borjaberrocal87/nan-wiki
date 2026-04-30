#!/bin/bash
set -e

# Run API tests with coverage
python3 -m pytest tests/ -v --cov=src --cov-report=term-missing --cov-fail-under=80
