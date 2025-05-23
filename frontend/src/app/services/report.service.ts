import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { DailyCashRegisterResponse } from "src/responses/dailyCashRegisterResponse.interface";
import { UserCommissionResponse } from "src/responses/userCommissionResponse.interface";

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
     * @returns Observable con la información de comisiones por usuario
     */
    getUserSalesReport(date: Date = new Date()): Observable<UserCommissionResponse[]> {
        const formattedDate = date.toISOString().split('T')[0];
        return this.http.get<UserCommissionResponse[]>(`${this.apiUrl}/api/reports/user-sales`, {
            params: { date: formattedDate }
        });
    }
}