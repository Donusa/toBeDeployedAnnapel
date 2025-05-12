import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../app/services/authentication.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthenticationRequest } from '../../request/authenticationRequest.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  hidePassword: boolean = true;
  capsLockOn: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  checkCapsLock(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState('CapsLock');
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Por favor, complete todos los campos';
      return;
    }

    const request: AuthenticationRequest = {
      username: this.username.toLowerCase(),
      password: this.password
    };
    this.authService.login(request).subscribe({
      next: (response) => {
        if (response && response.token) {
          this.router.navigate(['/home']);
        } else {
          this.error = 'Error en la respuesta del servidor';
        }
      },
      error: (error) => {
        if (error.status === 401) {
          this.error = 'Usuario o contraseña incorrectos';
          this.password = '';
        } else if (error.status === 0) {
          this.error = 'No se puede conectar al servidor. Por favor, verifique su conexión.';
        } else {
          this.error = 'Error durante el inicio de sesión. Por favor, intente nuevamente.';
        }
      }
    });
  }
}