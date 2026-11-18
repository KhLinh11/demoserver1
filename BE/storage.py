"""Quản lý lưu trữ SQLite và tệp runtime theo chuẩn DATN."""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from BE.schemas import CleansingStats, OrderRecord, PnLSummary, RunInfo


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self):
        with self.connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    total_rows INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    company_name TEXT NOT NULL DEFAULT '',
                    painpoints TEXT NOT NULL DEFAULT '',
                    expectations TEXT NOT NULL DEFAULT '',
                    stats_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS orders (
                    run_id TEXT NOT NULL,
                    stt INTEGER NOT NULL,
                    order_id TEXT NOT NULL,
                    order_date TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    product_name TEXT NOT NULL,
                    order_value REAL NOT NULL,
                    discount_amount REAL NOT NULL,
                    net_order_value REAL NOT NULL,
                    cogs REAL NOT NULL,
                    return_value REAL NOT NULL DEFAULT 0,
                    days_after_order INTEGER NOT NULL DEFAULT 0,
                    cogs_recovered REAL NOT NULL DEFAULT 0,
                    damaged_restock_loss REAL NOT NULL DEFAULT 0,
                    status TEXT NOT NULL,
                    status_color TEXT NOT NULL,
                    algo TEXT NOT NULL,
                    PRIMARY KEY (run_id, stt),
                    FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS pnl_snapshots (
                    run_id TEXT PRIMARY KEY,
                    summary_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE
                );
            """)

    def create_run(
        self,
        run_id: str,
        filename: str,
        total_rows: int,
        company_name: str,
        painpoints: str,
        expectations: str,
        stats: CleansingStats,
    ) -> RunInfo:
        now = utc_now()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO runs (id, filename, total_rows, status, company_name, painpoints, expectations, stats_json, created_at, updated_at)
                VALUES (?, ?, ?, 'cleansed', ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_id,
                    filename,
                    total_rows,
                    company_name,
                    painpoints,
                    expectations,
                    json.dumps(stats.model_dump()),
                    now,
                    now,
                ),
            )
        return self.get_run(run_id)

    def save_orders(self, run_id: str, orders: list[OrderRecord]):
        with self.connect() as conn:
            conn.execute("DELETE FROM orders WHERE run_id = ?", (run_id,))
            conn.executemany(
                """
                INSERT INTO orders (
                    run_id, stt, order_id, order_date, channel, product_name,
                    order_value, discount_amount, net_order_value, cogs,
                    return_value, days_after_order, cogs_recovered, damaged_restock_loss,
                    status, status_color, algo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        run_id,
                        o.stt,
                        o.order_id,
                        o.order_date,
                        o.channel,
                        o.product_name,
                        o.order_value,
                        o.discount_amount,
                        o.net_order_value,
                        o.cogs,
                        o.return_value,
                        o.days_after_order,
                        o.cogs_recovered,
                        o.damaged_restock_loss,
                        o.status,
                        o.status_color,
                        o.algo,
                    )
                    for o in orders
                ],
            )

    def get_orders(
        self,
        run_id: str,
        offset: int = 0,
        limit: int = 50,
        status_filter: str | None = None,
        search: str | None = None,
    ) -> tuple[list[OrderRecord], int]:
        with self.connect() as conn:
            query = "SELECT * FROM orders WHERE run_id = ?"
            params: list[Any] = [run_id]

            if status_filter and status_filter != "all":
                query += " AND status LIKE ?"
                params.append(f"%{status_filter}%")

            if search:
                query += " AND (order_id LIKE ? OR product_name LIKE ? OR channel LIKE ?)"
                kw = f"%{search}%"
                params.extend([kw, kw, kw])

            # Đếm tổng
            count_query = f"SELECT COUNT(*) FROM ({query})"
            total = conn.execute(count_query, params).fetchone()[0]

            query += " ORDER BY stt ASC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, params).fetchall()
            items = [
                OrderRecord(
                    stt=r["stt"],
                    order_id=r["order_id"],
                    order_date=r["order_date"],
                    channel=r["channel"],
                    product_name=r["product_name"],
                    order_value=r["order_value"],
                    discount_amount=r["discount_amount"],
                    net_order_value=r["net_order_value"],
                    cogs=r["cogs"],
                    return_value=r["return_value"],
                    days_after_order=r["days_after_order"],
                    cogs_recovered=r["cogs_recovered"],
                    damaged_restock_loss=r["damaged_restock_loss"],
                    status=r["status"],
                    status_color=r["status_color"],
                    algo=r["algo"],
                )
                for r in rows
            ]
            return items, total

    def save_pnl_snapshot(self, run_id: str, summary: PnLSummary):
        now = utc_now()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO pnl_snapshots (run_id, summary_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(run_id) DO UPDATE SET summary_json = excluded.summary_json, updated_at = excluded.updated_at
                """,
                (run_id, json.dumps(summary.model_dump()), now),
            )

    def get_pnl_snapshot(self, run_id: str) -> PnLSummary | None:
        with self.connect() as conn:
            row = conn.execute("SELECT summary_json FROM pnl_snapshots WHERE run_id = ?", (run_id,)).fetchone()
            if not row:
                return None
            data = json.loads(row["summary_json"])
            return PnLSummary(**data)

    def update_run_status(self, run_id: str, status: str):
        now = utc_now()
        with self.connect() as conn:
            conn.execute("UPDATE runs SET status = ?, updated_at = ? WHERE id = ?", (status, now, run_id))

    def get_run(self, run_id: str) -> RunInfo | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
            if not row:
                return None
            stats = None
            if row["stats_json"]:
                try:
                    stats = CleansingStats(**json.loads(row["stats_json"]))
                except Exception:
                    pass
            return RunInfo(
                id=row["id"],
                filename=row["filename"],
                total_rows=row["total_rows"],
                status=row["status"],
                company_name=row["company_name"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                cleansing_stats=stats,
            )

    def list_runs(self, limit: int = 50) -> list[RunInfo]:
        with self.connect() as conn:
            rows = conn.execute("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
            result = []
            for row in rows:
                stats = None
                if row["stats_json"]:
                    try:
                        stats = CleansingStats(**json.loads(row["stats_json"]))
                    except Exception:
                        pass
                result.append(
                    RunInfo(
                        id=row["id"],
                        filename=row["filename"],
                        total_rows=row["total_rows"],
                        status=row["status"],
                        company_name=row["company_name"],
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                        cleansing_stats=stats,
                    )
                )
            return result
