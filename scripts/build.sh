#!/bin/bash
set -a
source "$(dirname "$0")/../.env"
set +a
vp run tauri:build
