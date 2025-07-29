import { OrderItemRequest } from "./orderItemRequest.interface";
export interface OrderRequest {
clientId: number;
sellerId: number;
orderItems: OrderItemRequest[];
deliveryDate: string; // formato "YYYY-MM-DD"
delivered: boolean;
paid: boolean;
amountDue: number;
shippingMethod: string;
paymentMethodId: number;
shippingCost: number;
customDiscount?: number;
}