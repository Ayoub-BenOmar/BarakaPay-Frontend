import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OperationService, AccountResponse, OperationResponse } from '../../../../core/services/operation.service';
@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})

export class ClientDashboardComponent implements OnInit {
  account: AccountResponse | null = null;
  operations: OperationResponse[] = [];

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  isLoadingAccount = false;
  isLoadingOperations = false;
  errorAccount: string | null = null;
  errorOperations: string | null = null;

  constructor(
    private operationService: OperationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAccount();
    this.loadOperations();
  }
  onLogout(): void {
    this.authService.logout();
  }
  loadAccount(): void {
    this.isLoadingAccount = true;
    this.errorAccount = null;

    this.operationService.getMyAccount().subscribe({
      next: (account) => {
        this.account = account;
      },
      error: () => {
        this.errorAccount = 'Impossible de charger les informations du compte.';
      },
      complete: () => {
        this.isLoadingAccount = false;
      }
    });
  }

  loadOperations(page: number = this.page): void {
    this.isLoadingOperations = true;
    this.errorOperations = null;

    this.operationService.getMyOperations().subscribe({
      next: (response) => {
        // Backend returns List<OperationDto> directly
        this.operations = response;

        // Mock pagination stats since backend doesn't support it yet
        this.page = 0;
        this.size = response.length; // Show all
        this.totalElements = response.length;
        this.totalPages = 1;

        this.computeStats();
      },
      error: () => {
        this.errorOperations = "Impossible de charger l'historique des opérations.";
      },
      complete: () => {
        this.isLoadingOperations = false;
      }
    });
  }

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase();
  }

  goToPage(page: number): void {
    // Client-side pagination can be implemented here if needed
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    // For now, since we fetch all, just ignore or implement client slicing if list is huge
    // this.loadOperations(page); 
  }

  pendingCount = 0;
  validatedDepositsCount = 0;

  private computeStats(): void {
    this.pendingCount = this.operations.filter((op) => op.operationStatus === 'PENDING').length;

    this.validatedDepositsCount = this.operations.filter(
      (op) => op.operationType === 'DEPOSIT' && op.operationStatus === 'VALIDATED'
    ).length;
  }
}