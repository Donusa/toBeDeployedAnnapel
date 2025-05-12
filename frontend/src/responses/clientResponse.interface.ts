export interface ClientResponse {
    id: number;
    name: string;
    address?: string;
    phone: string;
    dni?: string;
    email?: string;
    currentAccount?:number;
    discount?:number;
    location:string;
}