import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserResponse } from '../../responses/userResponse.interface';
import { Router } from '@angular/router';
import { UserService } from '../../app/services/user.service';
import { AuthenticationService } from '../../app/services/authentication.service';
import { NewUserDialogComponent } from '../user-management/new-user-dialog/new-user-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ]
})
export class UserManagementComponent implements OnInit {
  isAdmin: boolean = false;
  displayedColumns: string[] = ['name', 'email', 'role', 'commissionPercentage', 'actions'];
  dataSource = new MatTableDataSource<UserResponse>();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private userService: UserService,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.checkAdminRole();
    this.loadUsers();
  }

  checkAdminRole(): void {
    this.isAdmin = this.authService.isAdmin();
  }

  loadUsers(): void {
   this.userService.getUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(NewUserDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: () => {
            this.snackBar.open('Usuario creado con éxito', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error al crear usuario:', error);
            this.snackBar.open('Error al crear usuario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openEditDialog(user: any): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '400px',
      data: user
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(user.id, result).subscribe({
          next: () => {
            this.snackBar.open('Usuario actualizado con éxito', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error al actualizar usuario:', error);
            this.snackBar.open('Error al actualizar usuario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteUser(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.snackBar.open('Usuario eliminado con éxito', 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}