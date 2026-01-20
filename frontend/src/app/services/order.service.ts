import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderRequest } from 'src/request/orderRequest.interface';
import { OrderResponse } from 'src/responses/orderResponse.interface';
import { TicketResponse } from 'src/responses/ticketResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.orders.base}`;

  constructor(private http: HttpClient) {}

  createOrder(OrderRequest:OrderRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${environment.endpoints.orders.create}`,OrderRequest);
  }

  getAllOrders(): Observable<OrderResponse[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  updateOrder(id: number, order: OrderRequest): Observable<OrderRequest> {
    const url = `${this.apiUrl}${environment.endpoints.orders.update.replace('{id}', id.toString())}`;
    return this.http.put<OrderRequest>(url, order);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${environment.endpoints.orders.delete}${id}`);
  }

  getTicket(orderId: number): Observable<TicketResponse> {
    return new Observable<TicketResponse>(observer => {
      this.http.get<TicketResponse>(`${environment.apiUrl}/api/reports/ticket/${orderId}`).subscribe({
        next: (response) => {
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('[OrderService] Error al obtener el ticket:', error);
          observer.error(error);
        }
      });
    });
  }

  getOrdersByClient(clientId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUrl}${environment.endpoints.orders.getByClient}${clientId}`);
  }

}