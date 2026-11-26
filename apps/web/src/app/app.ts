import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, BottomNavComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(public auth: AuthService) {}
}
