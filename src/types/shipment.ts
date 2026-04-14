export interface RateRequest {
  fromAddress: Record<string, unknown>;
  toAddress: Record<string, unknown>;
  parcel: Record<string, unknown>;
  carrierIds?: number[];
}

export interface Rate {
  rateId: string;
  carrierName: string;
  serviceName: string;
  totalCharge: number;
  listRate: number;
  estimatedDays: number;
}

export interface Shipment {
  id: number;
  shipmentNo: string;
  trackingNo: string;
  carrierName: string;
  serviceName: string;
  status: string;
  totalCharge: number;
  labelUrl: string;
  createTime: string;
}
