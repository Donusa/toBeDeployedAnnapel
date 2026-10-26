import { OrderItemRequest } from "./orderItemRequest.interface";
export interface OrderRequest {
clientId: number;
sellerId: number;
orderItems: OrderItemRequest[];
orderDate?: string; // formato "YYYY-MM-DD"
deliveryDate: string | null; // formato "YYYY-MM-DD" o sin fecha
delivered: boolean;
paid: boolean;
amountDue: number;
shippingMethod: string;
paymentMethodId: number;
shippingCost: number;
customDiscount?: number;
}
