import { ProductResponse } from "./productResponse.interface";

export interface DailyCashRegisterResponse {
productsSold: ProductSoldInfo[];
cashIncome:number;
cardIncome:number;
transferIncome:number;
totalIncome:number;
commissionPercentage:number;
commissionAmount:number;
shippingPayments:number;
}


export interface ProductSoldInfo {
product:ProductResponse;
quantity:number;
totalAmount:number;
}