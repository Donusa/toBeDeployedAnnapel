import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Product } from '../../interfaces/product.interface';
import { ProductRequest } from 'src/request/productRequest.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) {}


  createProduct(ProductRequest: ProductRequest): Observable<any> {
    return this.http.post<Product>(this.apiUrl, ProductRequest);
  }
  
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  updateProduct(id: number, product: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
