import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { VehiclesService } from '@core/services/vehicles.service';
import { User, Vehicle } from '@core/models/index';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { RatingComponent } from '@shared/components/rating/rating.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent, InputComponent, RatingComponent, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  vehicles: Vehicle[] = [];
  form: FormGroup;
  vehicleForm: FormGroup;
  saving = false;
  savingVehicle = false;
  showVehicleForm = false;

  constructor(
    public auth: AuthService,
    private usersService: UsersService,
    private vehiclesService: VehiclesService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      city: [''],
    });

    this.vehicleForm = this.fb.group({
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: [null],
      color: ['', Validators.required],
      plate: [''],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.usersService.getProfile().subscribe((user: User) => {
      this.user = user;
      this.form.patchValue(user);
      this.auth.updateStoredUser(user);
    });
    this.vehiclesService.getMyVehicles().subscribe((vehicles: Vehicle[]) => {
      this.vehicles = vehicles;
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.usersService.updateProfile(this.form.value).subscribe((user: User) => {
      this.user = user;
      this.auth.updateStoredUser(user);
      this.saving = false;
    });
  }

  onVehicleSubmit(): void {
    if (this.vehicleForm.invalid) return;
    this.savingVehicle = true;
    this.vehiclesService.create(this.vehicleForm.value).subscribe(() => {
      this.savingVehicle = false;
      this.showVehicleForm = false;
      this.vehicleForm.reset();
      this.loadProfile();
    });
  }
}
