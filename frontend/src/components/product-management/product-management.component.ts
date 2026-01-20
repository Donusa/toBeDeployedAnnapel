import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../app/services/product.service';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';
import { EditProductDialogComponent } from './edit-product-dialog/edit-product-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BulkEditProductsDialogComponent, BulkEditProductsResult } from './bulk-edit-products-dialog/bulk-edit-products-dialog.component';
import { Product } from 'src/interfaces/product.interface';
import { ProductRequest } from 'src/request/productRequest.interface';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCheckboxModule,
    MatSelectModule
  ]
})
export class ProductManagementComponent implements OnInit {
  displayedColumns: string[] = ['select', 'name', 'formaldehydePercentage', 'price', 'cost', 'type', 'code', 'size', 'currentStock', 'minimumStock', 'actions'];
  dataSource = new MatTableDataSource<Product>();
  selection = new SelectionModel<Product>(true, []);

  searchText = '';

  groupBy: 'type' | 'size' | 'formaldehydePercentage' = 'type';
  groupValue: string = '';

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private productService: ProductService
  ) {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return data.name.toLowerCase().includes(filter.toLowerCase()) ||
             data.code.toLowerCase().includes(filter.toLowerCase()) ||
             data.type.toLowerCase().includes(filter.toLowerCase());
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.selection.clear();
      },
      error: (error) => {
        this.snackBar.open('Error al cargar los productos', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  deleteProduct(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado con éxito', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadProducts();
        },
        error: (error) => {
          this.snackBar.open('Error al eliminar el producto', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.createProduct(result).subscribe({
          next: () => {
            this.snackBar.open('Producto agregado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadProducts();
          },
          error: (error) => {
            this.snackBar.open('Error al agregar el producto', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openEditDialog(product: any): void {
    const dialogRef = this.dialog.open(EditProductDialogComponent, {
      width: '500px',
      data: product
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.updateProduct(product.id, result).subscribe({
          next: () => {
            this.loadProducts();
            this.snackBar.open('Producto actualizado con éxito', 'Cerrar', {
              duration: 3000
            });
          },
          error: (error) => {
            this.snackBar.open('Error al actualizar el producto', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.getSelectionScope().length;
    return numRows > 0 && numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.getSelectionScope().forEach(row => this.selection.select(row));
  }

  clearSelection(): void {
    this.selection.clear();
  }

  selectFiltered(): void {
    this.getSelectionScope().forEach(row => this.selection.select(row));
  }

  selectGroup(): void {
    const value = this.groupValue;
    if (!value) return;

    const scope = this.getSelectionScope();
    scope.forEach(row => {
      const rowValue = String((row as any)[this.groupBy] ?? '');
      if (rowValue === value) this.selection.select(row);
    });
  }

  getGroupValues(): string[] {
    const scope = this.getSelectionScope();
    const values = new Set<string>();
    scope.forEach(row => values.add(String((row as any)[this.groupBy] ?? '')));
    return Array.from(values).filter(v => v !== '').sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  onGroupByChange(): void {
    this.groupValue = '';
  }

  openBulkEditDialog(): void {
    const selectedCount = this.selection.selected.length;
    if (selectedCount === 0) return;

    const dialogRef = this.dialog.open(BulkEditProductsDialogComponent, {
      width: '620px',
      data: { selectedCount }
    });

    dialogRef.afterClosed().subscribe((result?: BulkEditProductsResult) => {
      if (!result) return;
      this.applyBulkEdit(result);
    });
  }

  private applyBulkEdit(result: BulkEditProductsResult): void {
    const selected = [...this.selection.selected];
    if (selected.length === 0) return;

    let updatedCount = 0;
    let failedCount = 0;

    const requests = selected.map(product => {
      const payload = this.buildUpdatedProduct(product, result);
      return this.productService.updateProduct(product.id as number, payload).pipe(
        catchError(() => {
          failedCount += 1;
          return of(null);
        })
      );
    });

    forkJoin(requests).subscribe({
      next: (responses) => {
        updatedCount = responses.filter(r => r !== null).length;
        const messageParts: string[] = [];
        if (updatedCount > 0) messageParts.push(`${updatedCount} actualizados`);
        if (failedCount > 0) messageParts.push(`${failedCount} con error`);
        const message = messageParts.length ? `Edición masiva: ${messageParts.join(', ')}` : 'Edición masiva finalizada';

        this.snackBar.open(message, 'Cerrar', { duration: 3500 });
        this.loadProducts();
      },
      error: () => {
        this.snackBar.open('Error al aplicar la edición masiva', 'Cerrar', { duration: 3500 });
      }
    });
  }

  private buildUpdatedProduct(product: Product, result: BulkEditProductsResult): ProductRequest {
    const updated: ProductRequest = {
      name: product.name,
      formaldehydePercentage: product.formaldehydePercentage,
      price: product.price,
      cost: product.cost,
      type: product.type,
      code: product.code,
      size: product.size,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock
    };

    if (result.applyPrice && result.priceValue !== null && result.priceValue !== undefined) {
      updated.price = this.applyNumberMode(product.price, result.priceMode, result.priceValue);
    }
    if (result.applyCost && result.costValue !== null && result.costValue !== undefined) {
      updated.cost = this.applyNumberMode(product.cost, result.costMode, result.costValue);
    }
    if (result.applyType && result.type !== null && result.type !== undefined && result.type !== '') {
      updated.type = result.type;
    }
    if (result.applySize && result.size !== null && result.size !== undefined && result.size !== '') {
      updated.size = result.size;
    }
    if (result.applyFormaldehydePercentage && result.formaldehydePercentage !== null && result.formaldehydePercentage !== undefined) {
      updated.formaldehydePercentage = result.formaldehydePercentage;
    }
    if (result.applyMinimumStock && result.minimumStock !== null && result.minimumStock !== undefined) {
      updated.minimumStock = result.minimumStock;
    }

    if (updated.price < 0) updated.price = 0;
    if (updated.cost < 0) updated.cost = 0;
    if (updated.formaldehydePercentage < 0) updated.formaldehydePercentage = 0;
    if (updated.formaldehydePercentage > 100) updated.formaldehydePercentage = 100;
    if (updated.currentStock < 0) updated.currentStock = 0;
    if (updated.minimumStock < 0) updated.minimumStock = 0;

    return updated;
  }

  private applyNumberMode(current: number, mode: any, value: number): number {
    if (mode === 'set') return value;
    if (mode === 'increaseAmount') return current + value;
    if (mode === 'increasePercent') return current * (1 + value / 100);
    return current;
  }

  private getSelectionScope(): Product[] {
    return this.dataSource.filteredData ?? this.dataSource.data ?? [];
  }
}
