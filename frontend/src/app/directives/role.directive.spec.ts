import { TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { RoleDirective } from './role.directive';

describe('RoleDirective', () => {
  it('should create an instance', () => {
    const templateRef = {} as TemplateRef<any>;
    const viewContainerRef = {} as ViewContainerRef;
    const authenticationService = {} as AuthenticationService;
    const directive = new RoleDirective(templateRef, viewContainerRef, authenticationService);
    expect(directive).toBeTruthy();
  });
});
