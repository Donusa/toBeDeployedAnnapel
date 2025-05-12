import { ClientResponse } from "./clientResponse.interface";
import { UserResponse } from "./userResponse.interface";
import { OrderItemResponse } from "./orderItemResponse.interface";
import { PaymentMethod } from "../interfaces/paymentMethod.interface";
export interface OrderResponse {
id: number;
client: ClientResponse;
seller: UserResponse;
orderItems: OrderItemResponse[];
orderDate: string;
deliveryDate: string;
delivered: boolean;
paid: boolean;
amountDue: number;
shippingMethod: string;
paymentMethod: PaymentMethod;
shippingCost: number;
}