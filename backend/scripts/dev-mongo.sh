#!/usr/bin/env bash
# Starts a project-local MongoDB instance as a single-node replica set, isolated
# from any other mongod on this machine (own data dir + port). Required because
# the app uses multi-document transactions (see src/controllers/issueController.js),
# which standalone MongoDB does not support.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$DIR/.mongodb-data"
PORT=27018

mkdir -p "$DATA_DIR"

if pgrep -f "mongod --replSet rs0 --port $PORT" > /dev/null; then
  echo "Project-local mongod already running on port $PORT"
  exit 0
fi

mongod --replSet rs0 --port "$PORT" --dbpath "$DATA_DIR" --bind_ip localhost --fork --logpath "$DATA_DIR/mongod.log"

sleep 1
mongosh --port "$PORT" --quiet --eval "rs.status().ok" | grep -q 1 || mongosh --port "$PORT" --quiet --eval "rs.initiate()"

echo "MongoDB replica set ready at mongodb://localhost:$PORT/jira-clone-dev?replicaSet=rs0"
