import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OperationRequest {
  type: OperationType; // 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  amount: number;
  destinationAccountNumber?: string | null;
}

export interface AccountResponse {
  accountId: number;
  accountNumber: string;
  balance: number;
  ownerEmail: string;
  ownerFullName: string;
}

export type OperationStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';
export type OperationType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export interface OperationResponse {
  id: number;
  operationType: OperationType;
  amount: number;
  operationStatus: OperationStatus;
  createdAt: string;
  executedAt: string | null;
  accountSourceId: number | null;
  accountDestinationId: number | null;
  accountSourceNumber?: string | null;
  accountDestinationNumber?: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DocumentResponse {
  id: number;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface OperationOwner {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface OperationAccount {
  id: number;
  accountNumber: string;
  balance: number;
  owner: OperationOwner;
}

export interface OperationDocument {
  id: number;
  fileName: string;
  fileType: string;
  storagePath: string;
  uploadedAt: string;
}

export interface AgentDocumentResponse {
  id: number;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  operationId: number;
}

export interface PendingOperation extends OperationResponse {
  // Backend JSON for pending ops seems to match OperationResponse structure + potential extras?
  // If backend returns simplified JSON without nested objects, we must adapt.
  // Assuming list of docs IDs is returned as documentIds: number[] based on user sample
  documentIds?: number[];

  // Client info returned directly by backend
  clientName?: string;
  clientEmail?: string;

  // Keep these if we hope backend eventually sends them, or make optional
  accountSource?: OperationAccount;
  accountDestination?: OperationAccount | null;
  documents?: OperationDocument[] | null;

  // Flag envoyé par l’API pour indiquer la présence de justificatif (si dispo)
  hasDocument?: boolean;

  aiDecision?: string | null;
  aiComment?: string | null;
  aiEvaluatedAt?: string | null;
}

/**
 * Service de consultation des comptes et opérations pour le client.
 */
@Injectable({
  providedIn: 'root'
})
export class OperationService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getMyAccount(): Observable<AccountResponse> {
    const url = `${this.baseUrl}/api/client/my-account`;
    return this.http.get<AccountResponse>(url);
  }

  getMyOperations(): Observable<OperationResponse[]> {
    const url = `${this.baseUrl}/api/client/my-operations`;
    return this.http.get<OperationResponse[]>(url);
  }

  getPendingOperations(): Observable<PendingOperation[]> {
    const url = `${this.baseUrl}/api/agent/operations/pending`;
    return this.http.get<PendingOperation[]>(url);
  }

  deposit(amount: number): Observable<OperationResponse> {
    const url = `${this.baseUrl}/api/client/deposit`;
    const params = new HttpParams().set('amount', amount.toString());
    return this.http.post<OperationResponse>(url, {}, { params });
  }

  withdraw(amount: number): Observable<OperationResponse> {
    const url = `${this.baseUrl}/api/client/withdraw`;
    const params = new HttpParams().set('amount', amount.toString());
    return this.http.post<OperationResponse>(url, {}, { params });
  }

  transfer(amount: number, destinationAccountNumber: string): Observable<OperationResponse> {
    const url = `${this.baseUrl}/api/client/transfer`;
    const params = new HttpParams()
      .set('amount', amount.toString())
      .set('toAccount', destinationAccountNumber);
    return this.http.post<OperationResponse>(url, {}, { params });
  }

  uploadJustificatif(operationId: number, file: File): Observable<DocumentResponse> {
    const url = `${this.baseUrl}/api/client/operations/${operationId}/documents`;
    const formData = new FormData();
    formData.append('document', file); // Changed from 'file' to 'document'
    return this.http.post<DocumentResponse>(url, formData);
  }

  getOperationDocuments(operationId: number): Observable<AgentDocumentResponse[]> {
    const url = `${this.baseUrl}/api/agent/operations/${operationId}/documents`;
    return this.http.get<AgentDocumentResponse[]>(url);
  }

  approveOperation(operationId: number): Observable<PendingOperation> {
    const url = `${this.baseUrl}/api/agent/operations/${operationId}/approve`;
    return this.http.put<PendingOperation>(url, {});
  }

  rejectOperation(operationId: number): Observable<PendingOperation> {
    const url = `${this.baseUrl}/api/agent/operations/${operationId}/reject`;
    return this.http.put<PendingOperation>(url, {});
  }

  downloadAgentDocument(documentId: number): Observable<Blob> {
    const url = `${this.baseUrl}/api/agent/documents/${documentId}/download`;
    return this.http.get(url, { responseType: 'blob' }) as Observable<Blob>;
  }
}