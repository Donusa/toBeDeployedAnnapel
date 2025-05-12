import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ClientRequest } from "src/request/clientRequest.interface";
import { ClientResponse } from "src/responses/clientResponse.interface";

@Injectable({
    providedIn: 'root'
})
export class ClientService {

    private apiUrl = `${environment.apiUrl}${environment.endpoints.clients.base}`;
    
    constructor(private http:HttpClient) {}

    createClient(ClientRequest:ClientRequest):Observable<any> {
        return this.http.post<any>(`${this.apiUrl}${environment.endpoints.clients.create}`,ClientRequest);
    }

    getClients():Observable<ClientResponse[]> {
        return this.http.get<ClientResponse[]>(`${this.apiUrl}${environment.endpoints.clients.getAll}`);
    }

    updateClient(id:number, client:ClientRequest):Observable<ClientResponse> {
        const url = `${this.apiUrl}${environment.endpoints.clients.update.replace('{id}', id.toString())}`;
        return this.http.put<ClientResponse>(url, client);
    }

    deleteUser(id:number):Observable<any> {
        const url = `${this.apiUrl}${environment.endpoints.clients.delete.replace('{id}', id.toString())}`;
        return this.http.delete(url);
    }
}