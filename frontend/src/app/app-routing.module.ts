import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ProductManagementComponent } from '../components/product-management/product-management.component';
import { OrderManagementComponent } from '../components/order-management/order-management.component';
import { CashRegisterComponent } from '../components/cash-register/cash-register.component';
import { UserManagementComponent } from '../components/user-management/user-management.component';
import { CustomerManagementComponent } from '../components/client-management/client-management.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
  { path: 'product-management', component: ProductManagementComponent, canActivate: [AuthGuardService] },
  { path: 'orders', component: OrderManagementComponent, canActivate: [AuthGuardService] },
  { path: 'cash-register', component: CashRegisterComponent, canActivate: [AuthGuardService] },
  { path: 'users', component: UserManagementComponent, canActivate: [AuthGuardService] },
  { path: 'customer-management', component: CustomerManagementComponent, canActivate: [AuthGuardService] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
