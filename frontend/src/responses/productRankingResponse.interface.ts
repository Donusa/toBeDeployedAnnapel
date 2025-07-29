import { ProductResponse } from './productResponse.interface';

export interface ProductRankingResponse {
    product: ProductResponse;
    totalQuantitySold: number;
    totalOrders: number;
    ranking: number;
}