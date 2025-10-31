import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SuppliesComponent } from './pages/supplies/supplies.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { RecetasComponent } from './pages/recetas/recetas.component';
import { RecetaDetalleComponent } from './pages/recetas/receta-detalle.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'recetas', pathMatch: 'full' },
  { path: 'recetas', component: RecetasComponent, canActivate: [authGuard] },
  { path: 'recetas/:id', component: RecetaDetalleComponent },
  { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
  { path: 'supplies', component: SuppliesComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
