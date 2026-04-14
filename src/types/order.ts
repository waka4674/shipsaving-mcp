export interface Order {
  id: number;
  orderNo: string;
  status: string;
  storeName: string;
  recipientName: string;
  totalAmount: number;
  createTime: string;
}
