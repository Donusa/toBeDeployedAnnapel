import { ProductResponse } from "./productResponse.interface";

export interface DailyCashRegisterResponse {
date?: string;
startDate?: string;
endDate?: string;
productsSold: ProductSoldInfo[];
cashIncome:number;
cardIncome:number;
transferIncome:number;
totalIncome:number;
grossIncome:number;
discountAmount:number;
netIncome:number;
commissionPercentage:number;
commissionAmount:number;
shippingPayments:number;
}


export interface ProductSoldInfo {
product:ProductResponse;
quantity:number;
totalAmount:number;
}
