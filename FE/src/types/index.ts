export type RunStatus = "pending" | "processing" | "completed" | "approved" | "failed";

export type AttributionModel = "last_touch" | "first_touch" | "linear" | "u_shaped" | "data_driven";

export interface CleansingStats {
  total_rows: number;
  preserved_records: number;
  missing_imputed: number;
  deduplicated_rows: number;
  isolated_bots: number;
  virtual_revenue_deduplicated: number;
}

export interface OrderRecord {
  stt: number;
  order_id: string;
  order_date: string;
  channel: string;
  gross_revenue: number;
  discount: number;
  cogs: number;
  return_value: number;
  days_after_order: number;
  recovered_cogs: number;
  damaged_cogs: number;
  is_bot: boolean;
  is_duplicate: boolean;
  is_imputed: boolean;
  status: string;
}

export interface PnLLineItem {
  line_no: number;
  name: string;
  old_reported: number;
  audited_actual: number;
  variance: number;
  variance_percent: number;
  note: string;
}

export interface ChannelMetric {
  channel: string;
  gross_revenue: number;
  reported_net: number;
  audited_net: number;
  return_rate: number;
  ads_spend: number;
  contribution_profit: number;
  rank_old: number;
  rank_new: number;
  status: string;
}

export interface PnLSummary {
  lines: PnLLineItem[];
  channels: ChannelMetric[];
  total_gross: number;
  total_net_audited: number;
  total_cogs_loss: number;
  total_net_profit: number;
}

export interface RunInfo {
  id: string;
  filename: string;
  total_rows: number;
  status: RunStatus;
  company_name: string;
  created_at: string;
  updated_at: string;
  cleansing_stats?: CleansingStats | null;
}

export interface DataPage {
  run_id: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: OrderRecord[];
}

export interface AnalyticsResult {
  stats: CleansingStats;
  orders: OrderRecord[];
  pnl: PnLSummary;
  channels: ChannelMetric[];
  availableDimensions: string[];
  activeDimension: string;
  totalRawRows: number;
  isSampled: boolean;
}

export interface WhatIfRequest {
  attribution_model: AttributionModel;
  return_factor: number;
  cost_factor: number;
  dimension?: string;
}
