import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AddCustomerDialogComponent } from './add-client-dialog/add-client-dialog.component';
import { environment } from 'src/environments/environment';
import { ClientService } from 'src/app/services/client.service';
import { EditClientDialogComponent } from './edit-client-dialog/edit-client-dialog.component';
import { ClientHistoryDialogComponent } from './client-history-dialog/client-history-dialog.component';

@Component({
  selector: 'app-customer-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css'],
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
    FormsModule
  ]
})
export class CustomerManagementComponent implements OnInit {
  displayedColumns: string[] = ['name', 'address', 'phone', 'dni', 'email', 'currentAccount', 'discount', 'location', 'actions'];
  dataSource = new MatTableDataSource<any>();

  searchText = '';

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private http: HttpClient,
    private clientService:ClientService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return (data.name && data.name.toLowerCase().includes(filter.toLowerCase())) ||
             (data.phone && data.phone.toLowerCase().includes(filter.toLowerCase())) ||
             (data.dni && data.dni.toLowerCase().includes(filter.toLowerCase()));
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadCustomers(): void {
    this.clientService.getClients().subscribe({
       next: (clients) => {
         this.dataSource.data = clients;
       },
       error: (error) => {
         console.error('Error al cargar clientes:', error);
       }
     });
   }

  deleteCustomer(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clientService.deleteUser(id).subscribe({
        next: () => {
          this.snackBar.open('Cliente eliminado con éxito', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadCustomers();
        },
        error: (error) => {
         console.error('Error al eliminar el cliente:', error);
         this.snackBar.open('Error al eliminar el cliente', 'Cerrar', { duration: 3000});
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddCustomerDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.createClient(result).subscribe({
          next: () => {
            this.snackBar.open('Cliente agregado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadCustomers();
          },
          error: (error) => {
           this.snackBar.open('Error al agregar el cliente', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        })
      }
    });
  }

  openEditDialog(customer: any): void {
    const dialogRef = this.dialog.open(EditClientDialogComponent, {
      width: '400px',
      data: customer
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
         this.clientService.updateClient(customer.id, result).subscribe({
          next: () => {
            this.snackBar.open('Cliente actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadCustomers();
          },
          error: (error) => {
            if (error.status === 401) {
              this.router.navigate(['/login']);
            }
            this.snackBar.open('Error al actualizar el cliente', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openHistoryDialog(client: any): void {
    this.dialog.open(ClientHistoryDialogComponent, {
      width: '800px',
      data: { clientId: client.id, clientName: client.name }
    });
  }
}