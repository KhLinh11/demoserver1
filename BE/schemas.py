"""Pydantic schemas cho API; định nghĩa hợp đồng dữ liệu giữa FE và BE."""

from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field


RunStatus = Literal["uploaded", "cleansed", "approved", "completed", "failed"]
AttributionModel = Literal["last_touch", "first_touch", "linear", "u_shaped", "data_driven"]


class OrderRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    stt: int
    order_id: str
    order_date: str
    channel: str
    product_name: str
    order_value: float
    discount_amount: float
    net_order_value: float
    cogs: float
    return_value: float = 0.0
    days_after_order: int = 0
    cogs_recovered: float = 0.0
    damaged_restock_loss: float = 0.0
    status: str
    status_color: str = "bg-[#EBF6FC] text-[#079DD9]"
    algo: str


class CleansingStats(BaseModel):
    model_config = ConfigDict(extra="forbid")
    total_rows: int
    preserved_records: int
    missing_imputed: int
    deduplicated_rows: int
    isolated_bots: int
    virtual_revenue_deduplicated: float


class HitlApprovalRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: Literal["approved", "rejected", "modified"] = "approved"
    notes: str = Field(default="", max_length=1000)


class WhatIfRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    attribution_model: AttributionModel = Field(
        default="data_driven",
        description="Mô hình gán công tiếp thị: last_touch, first_touch, linear, u_shaped, data_driven",
    )
    return_factor: float = Field(default=1.0, ge=0.25, le=2.0, description="Hệ số bù trừ hoàn hàng muộn")
    cost_factor: float = Field(default=1.0, ge=0.25, le=2.0, description="Hệ số biến phí vận hành")
    dimension: str | None = Field(default=None, description="Chiều phân tích: Khu vực, Kênh bán, Sản phẩm, Cửa hàng")


class PnLLineItem(BaseModel):
    line_no: int
    name: str
    old_reported: float
    audited_actual: float
    variance: float
    variance_percent: float
    note: str


class ChannelMetric(BaseModel):
    channel: str
    gross_revenue: float
    reported_net: float
    audited_net: float
    return_rate: float
    ads_spend: float
    contribution_profit: float
    rank_old: int
    rank_new: int
    status: str


class PnLSummary(BaseModel):
    lines: list[PnLLineItem]
    channels: list[ChannelMetric]
    total_gross: float
    total_net_audited: float
    total_cogs_loss: float
    total_net_profit: float


class RunInfo(BaseModel):
    id: str
    filename: str
    total_rows: int
    status: RunStatus
    company_name: str
    created_at: str
    updated_at: str
    cleansing_stats: CleansingStats | None = None


class DataPage(BaseModel):
    items: list[OrderRecord]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorResponse(BaseModel):
    detail: str
