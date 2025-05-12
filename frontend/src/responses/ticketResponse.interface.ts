import { ClientResponse } from "./clientResponse.interface";
import { UserResponse } from "./userResponse.interface";
import { ProductTicketResponse } from "./productTicketResponse.interface";
export interface TicketResponse {
 orderId: number,
 orderDate: string,
 client: ClientResponse,
 seller: UserResponse,
 products: ProductTicketResponse[],
 subtotal: number,
 shippingCost: number,
 total: number
 paymentMethodName: string
 paid: boolean
}