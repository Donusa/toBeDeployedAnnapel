import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { DailyCashRegisterResponse } from "src/responses/dailyCashRegisterResponse.interface";
import { UserCommissionResponse } from "src/responses/userCommissionResponse.interface";
import { ProductRankingResponse } from "src/responses/productRankingResponse.interface";

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) {}

    generateTicket(id:number):Observable<any> {
        const url = `${this.apiUrl}/report/ticket/${id.toString()}`;
        return this.http.get<any>(url);
    }

    /**
     * Obtiene el reporte de caja diaria
     * @returns Observable con la información de la caja diaria
     */
    getDailyCashRegister(date: Date = new Date()): Observable<DailyCashRegisterResponse> {
        const formattedDate = date.toISOString().split('T')[0];
        return this.http.get<DailyCashRegisterResponse>(`${this.apiUrl}/api/reports/daily-cash-register`, {
            params: { date: formattedDate }
        });
    }

    /**
     * Obtiene el reporte de comisiones por usuario
     * @param date Fecha para la cual se quiere obtener el reporte
     * @param startDate Fecha inicio del rango (opcional)
     * @param endDate Fecha fin del rango (opcional)
     * @returns Observable con la información de comisiones por usuario
     */
    getUserSalesReport(date?: Date, startDate?: Date, endDate?: Date): Observable<UserCommissionResponse[]> {
        let params: any = {};

        if (startDate && endDate) {
            params.startDate = startDate.toISOString().split('T')[0];
            params.endDate = endDate.toISOString().split('T')[0];
        } else if (date) {
            params.date = date.toISOString().split('T')[0];
        } 
        // else: do not set params, let backend handle default range


        return this.http.get<UserCommissionResponse[]>(`${this.apiUrl}/api/reports/user-sales`, {
            params: params
        });
    }

    /**
     * Obtiene el ranking de productos por período
     * @param period Período: 'day', 'fortnight', 'month'
     * @param date Fecha de referencia para el período
     * @returns Observable con el ranking de productos
     */
    getProductRanking(period: string, date: Date = new Date()): Observable<ProductRankingResponse[]> {
        const formattedDate = date.toISOString().split('T')[0];
        return this.http.get<ProductRankingResponse[]>(`${this.apiUrl}/api/reports/product-ranking`, {
            params: { 
                period: period,
                date: formattedDate 
            }
        });
    }

    getProductRankingByDateRange(startDate: Date, endDate: Date): Observable<ProductRankingResponse[]> {
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        return this.http.get<ProductRankingResponse[]>(`${this.apiUrl}/api/reports/product-ranking`, {
            params: { 
                startDate: formattedStartDate,
                endDate: formattedEndDate 
            }
        });
    }
}