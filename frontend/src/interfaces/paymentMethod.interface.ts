export interface PaymentMethod {
    id: number;
    name: string;
}
export const PAYMENT_METHODS = {
    CASH: 'CASH',
    CARD: 'CARD',
    TRANSFER: 'TRANSFER'
} as const;