import { ProductResponse } from "./productResponse.interface";
export interface OrderItemResponse {
id: number;
productId: number;
productName: string;
productCode: string;
quantity: number;
price: number;
subtotal: number;
product: ProductResponse;
}