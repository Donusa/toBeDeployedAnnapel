import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../app/services/authentication.service';
import { DatePipe, CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatDividerModule,
    MatMenuModule,
    RouterModule,
    MatDialogModule
  ]
})
export class HomeComponent implements OnInit, AfterViewInit {
  username: string = '';
  userRole: string = '';
  userEmail: string = '';
  isAdmin: boolean = false;
  
  @ViewChild('sidenav') sidenav: any;

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    
  ) {
    this.username = localStorage.getItem('username') || '';
    this.userEmail = localStorage.getItem('email') || '';
    this.userRole = localStorage.getItem('role') || '';
    this.isAdmin = this.authenticationService.isAdmin();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  logout(): void {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }


}

