import { UserResponse } from './userResponse.interface';
import { OrderResponse } from './orderResponse.interface';

export interface UserCommissionResponse {
    user: UserResponse;
    orders: OrderResponse[];
    totalSales: number;
    totalCommission: number;
    date: string;
}