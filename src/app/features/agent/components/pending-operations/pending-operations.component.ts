import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  OperationService,
  PendingOperation,
  Page,
  AgentDocumentResponse
} from '../../../../core/services/operation.service';
import { OperationDetailComponent } from '../operation-detail/operation-detail.component';
import { environment } from '../../../../../environments/environment';

interface PendingOperationView {
  id: number;
  operationType: string;
  amount: number;
  operationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  createdAt: string;
  clientFullName: string;
  clientEmail: string;
  hasDocument: boolean;
  aiDecision?: string | null;
  aiComment?: string | null;
}

type SortField = 'createdAt' | 'amount' | 'clientFullName' | 'operationType';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-pending-operations',
  standalone: true,
  imports: [CommonModule, FormsModule, OperationDetailComponent],
  templateUrl: './pending-operations.component.html',
  styleUrls: ['./pending-operations.component.css']
})
export class PendingOperationsComponent implements OnInit {
  // Données
  // rawPage: Page<PendingOperation> | null = null;
  operations: PendingOperationView[] = [];
  allOperations: PendingOperation[] = [];

  // Pagination
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  // États UI
  isLoading = false;
  errorMessage: string | null = null;

  // Filtres simples
  filterType: '' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' = '';
  filterClient = '';

  // Tri simple
  sortField: SortField = 'createdAt';
  sortDirection: SortDirection = 'desc';

  // Détail
  selectedOperation: PendingOperation | null = null;
  detailDocuments: AgentDocumentResponse[] = [];
  isLoadingDocuments = false;
  actionInProgress = false;
  actionSuccessMessage: string | null = null;
  actionErrorMessage: string | null = null;

  readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private operationService: OperationService) { }

  ngOnInit(): void {
    this.loadPendingOperations();
  }

  loadPendingOperations(page: number = this.page): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.operationService.getPendingOperations().subscribe({
      next: (response) => {
        this.allOperations = response; // Store raw array

        // Mock pagination
        this.totalElements = response.length;
        this.totalPages = 1;

        const mapped = this.allOperations.map((op) => this.mapToView(op));
        this.operations = this.applyFiltersAndSort(mapped);

        // Si on avait une opération sélectionnée, la rafraîchir
        if (this.selectedOperation) {
          const updated = this.allOperations.find(
            (op) => op.id === this.selectedOperation?.id
          );
          if (updated) {
            this.selectedOperation = updated;
          } else {
            this.closeDetail();
          }
        }
      },
      error: (err) => {
        console.error('Erreur chargement opérations PENDING', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = "Vous n'êtes pas autorisé à consulter ces opérations.";
        } else {
          this.errorMessage = "Impossible de charger la liste des opérations PENDING.";
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private mapToView(op: PendingOperation): PendingOperationView {
    // Backend JSON structure changed:
    // - no nested accountSource/owner objects
    // - type -> operationType, status -> operationStatus
    // - documentIds array instead of documents object list?
    // - clientName and clientEmail now returned directly

    // 1) Utiliser le flag hasDocument si l'API le renvoie
    // 2) Sinon, déduire à partir de la liste documentIds ou documents
    const hasDoc =
      typeof op.hasDocument === 'boolean'
        ? op.hasDocument
        : (op.documentIds && op.documentIds.length > 0) || (op.documents && op.documents.length > 0);

    // Use clientName/clientEmail from backend, fallback to nested structure or placeholder
    const clientName = op.clientName ?? op.accountSource?.owner?.fullName ?? '—';
    const clientEmail = op.clientEmail ?? op.accountSource?.owner?.email ?? '—';

    return {
      id: op.id,
      operationType: op.operationType,
      amount: op.amount,
      operationStatus: op.operationStatus,
      createdAt: op.createdAt,
      clientFullName: clientName,
      clientEmail: clientEmail,
      hasDocument: !!hasDoc,
      aiDecision: op.aiDecision ?? null,
      aiComment: op.aiComment ?? null
    };
  }

  onFilterChange(): void {
    if (!this.allOperations) {
      return;
    }
    const mapped = this.allOperations.map((op) => this.mapToView(op));
    this.operations = this.applyFiltersAndSort(mapped);
  }

  onSortChange(): void {
    this.onFilterChange();
  }

  private applyFiltersAndSort(list: PendingOperationView[]): PendingOperationView[] {
    let result = [...list];

    // Filtre type
    if (this.filterType) {
      result = result.filter((op) => op.operationType === this.filterType);
    }

    // Filtre client (nom ou email)
    const term = this.filterClient.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (op) =>
          op.clientFullName.toLowerCase().includes(term) ||
          op.clientEmail.toLowerCase().includes(term)
      );
    }

    // Tri
    result.sort((a, b) => {
      let cmp = 0;

      switch (this.sortField) {
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'clientFullName':
          cmp = a.clientFullName.localeCompare(b.clientFullName);
          break;
        case 'operationType':
          cmp = a.operationType.localeCompare(b.operationType);
          break;
        case 'createdAt':
        default:
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  goToPage(page: number): void {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) {
      return;
    }
    this.loadPendingOperations(page);
  }

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase();
  }

  // === Détail ===

  openDetail(opId: number): void {
    if (!this.allOperations) {
      return;
    }
    const found = this.allOperations.find((op) => op.id === opId);
    if (!found) {
      return;
    }
    this.selectedOperation = found;
    this.actionSuccessMessage = null;
    this.actionErrorMessage = null;
    this.loadDocuments(found.id);
  }

  closeDetail(): void {
    this.selectedOperation = null;
    this.detailDocuments = [];
    this.isLoadingDocuments = false;
    this.actionInProgress = false;
    this.actionSuccessMessage = null;
    this.actionErrorMessage = null;
  }

  private loadDocuments(operationId: number): void {
    this.isLoadingDocuments = true;
    this.detailDocuments = [];

    this.operationService.getOperationDocuments(operationId).subscribe({
      next: (docs) => {
        this.detailDocuments = docs;
      },
      error: (err) => {
        console.error('Erreur chargement justificatifs', err);
        this.actionErrorMessage =
          err && err.error && err.error.message
            ? err.error.message
            : "Impossible de charger les justificatifs.";
      },
      complete: () => {
        this.isLoadingDocuments = false;
      }
    });
  }

  onApproveFromDetail(): void {
    if (!this.selectedOperation) {
      return;
    }
    this.actionInProgress = true;
    this.actionErrorMessage = null;
    this.actionSuccessMessage = null;

    this.operationService.approveOperation(this.selectedOperation.id).subscribe({
      next: () => {
        this.actionInProgress = false;
        this.actionSuccessMessage = 'Opération approuvée avec succès.';
        this.loadPendingOperations(this.page);
      },
      error: (err) => {
        this.actionInProgress = false;
        console.error('Erreur approbation', err);
        this.actionErrorMessage =
          err && err.error && err.error.message
            ? err.error.message
            : "Une erreur est survenue lors de l'approbation.";
      }
    });
  }

  onRejectFromDetail(): void {
    if (!this.selectedOperation) {
      return;
    }
    this.actionInProgress = true;
    this.actionErrorMessage = null;
    this.actionSuccessMessage = null;

    this.operationService.rejectOperation(this.selectedOperation.id).subscribe({
      next: () => {
        this.actionInProgress = false;
        this.actionSuccessMessage = 'Opération rejetée avec succès.';
        this.loadPendingOperations(this.page);
      },
      error: (err) => {
        this.actionInProgress = false;
        console.error('Erreur rejet', err);
        this.actionErrorMessage =
          err && err.error && err.error.message
            ? err.error.message
            : "Une erreur est survenue lors du rejet.";
      }
    });
  }

  onApprove(id: number, event: Event): void {
    event.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment approuver cette opération ?')) {
      return;
    }

    this.actionErrorMessage = null;
    this.operationService.approveOperation(id).subscribe({
      next: () => {
        this.loadPendingOperations(this.page);
      },
      error: (err) => {
        console.error('Erreur approbation', err);
        alert("Une erreur est survenue lors de l'approbation.");
      }
    });
  }

  onReject(id: number, event: Event): void {
    event.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment rejeter cette opération ?')) {
      return;
    }

    this.actionErrorMessage = null;
    this.operationService.rejectOperation(id).subscribe({
      next: () => {
        this.loadPendingOperations(this.page);
      },
      error: (err) => {
        console.error('Erreur rejet', err);
        alert("Une erreur est survenue lors du rejet.");
      }
    });
  }
}