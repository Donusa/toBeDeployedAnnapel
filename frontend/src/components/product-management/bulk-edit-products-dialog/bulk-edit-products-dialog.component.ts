import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

export type BulkEditNumberMode = 'set' | 'increaseAmount' | 'increasePercent';

export interface BulkEditProductsResult {
  applyPrice: boolean;
  priceMode: BulkEditNumberMode;
  priceValue: number | null;

  applyCost: boolean;
  costMode: BulkEditNumberMode;
  costValue: number | null;

  applyType: boolean;
  type: string | null;

  applySize: boolean;
  size: string | null;

  applyFormaldehydePercentage: boolean;
  formaldehydePercentage: number | null;

  applyMinimumStock: boolean;
  minimumStock: number | null;
}

@Component({
  selector: 'app-bulk-edit-products-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './bulk-edit-products-dialog.component.html',
  styleUrls: ['./bulk-edit-products-dialog.component.css']
})
export class BulkEditProductsDialogComponent {
  form: FormGroup;

  numberModes: { value: BulkEditNumberMode; label: string }[] = [
    { value: 'set', label: 'Fijar valor' },
    { value: 'increaseAmount', label: 'Sumar monto' },
    { value: 'increasePercent', label: 'Sumar %' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BulkEditProductsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { selectedCount: number }
  ) {
    this.form = this.fb.group({
      applyPrice: [false],
      priceMode: ['set', Validators.required],
      priceValue: [null],

      applyCost: [false],
      costMode: ['set', Validators.required],
      costValue: [null],

      applyType: [false],
      type: [null],

      applySize: [false],
      size: [null],

      applyFormaldehydePercentage: [false],
      formaldehydePercentage: [null, [Validators.min(0), Validators.max(100)]],

      applyMinimumStock: [false],
      minimumStock: [null, [Validators.min(0)]]
    });

    this.setupToggle('applyPrice', ['priceMode', 'priceValue']);
    this.setupToggle('applyCost', ['costMode', 'costValue']);
    this.setupToggle('applyType', ['type']);
    this.setupToggle('applySize', ['size']);
    this.setupToggle('applyFormaldehydePercentage', ['formaldehydePercentage']);
    this.setupToggle('applyMinimumStock', ['minimumStock']);
  }

  private setupToggle(applyControlName: string, targetControlNames: string[]): void {
    const applyControl = this.form.get(applyControlName);
    if (!applyControl) return;

    const setEnabled = (enabled: boolean) => {
      targetControlNames.forEach(name => {
        const ctrl = this.form.get(name);
        if (!ctrl) return;
        if (enabled) ctrl.enable({ emitEvent: false });
        else ctrl.disable({ emitEvent: false });
      });
    };

    setEnabled(!!applyControl.value);
    applyControl.valueChanges.subscribe(value => setEnabled(!!value));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    const value = this.form.value as BulkEditProductsResult;

    const hasAny =
      value.applyPrice ||
      value.applyCost ||
      value.applyType ||
      value.applySize ||
      value.applyFormaldehydePercentage ||
      value.applyMinimumStock;

    if (!hasAny) {
      this.dialogRef.close();
      return;
    }

    this.dialogRef.close(value);
  }
}
