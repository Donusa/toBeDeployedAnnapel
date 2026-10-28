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
        const formattedDate = this.formatLocalDate(date);
        return this.http.get<DailyCashRegisterResponse>(`${this.apiUrl}/api/reports/daily-cash-register`, {
            params: { date: formattedDate }
        });
    }

    getCashRegisterByDateRange(startDate: Date, endDate: Date): Observable<DailyCashRegisterResponse> {
        return this.http.get<DailyCashRegisterResponse>(`${this.apiUrl}/api/reports/daily-cash-register`, {
            params: {
                startDate: this.formatLocalDate(startDate),
                endDate: this.formatLocalDate(endDate)
            }
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
            params.startDate = this.formatLocalDate(startDate);
            params.endDate = this.formatLocalDate(endDate);
        } else if (date) {
            params.date = this.formatLocalDate(date);
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
        const formattedDate = this.formatLocalDate(date);
        return this.http.get<ProductRankingResponse[]>(`${this.apiUrl}/api/reports/product-ranking`, {
            params: { 
                period: period,
                date: formattedDate 
            }
        });
    }

    getProductRankingByDateRange(startDate: Date, endDate: Date): Observable<ProductRankingResponse[]> {
        const formattedStartDate = this.formatLocalDate(startDate);
        const formattedEndDate = this.formatLocalDate(endDate);
        return this.http.get<ProductRankingResponse[]>(`${this.apiUrl}/api/reports/product-ranking`, {
            params: { 
                startDate: formattedStartDate,
                endDate: formattedEndDate 
            }
        });
    }

    private formatLocalDate(date: Date): string {
        const year = date.getFullYear().toString().padStart(4, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
