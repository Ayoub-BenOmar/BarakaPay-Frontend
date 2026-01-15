import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserService,
  AdminUserSummary,
  Page
} from '../../../../core/services/user.service';

type SortField = 'createdAt' | 'fullName' | 'email' | 'role';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  // rawPage: Page<AdminUserSummary> | null = null; // Removing pagination support for now
  users: AdminUserSummary[] = []; // Used for filtered view
  allUsers: AdminUserSummary[] = []; // Stores all users from backend

  // pagination
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  // états UI
  isLoading = false;
  errorMessage: string | null = null;
  actionErrorMessage: string | null = null;

  // filtres front
  filterEmail = '';
  filterRole: '' | 'CLIENT' | 'AGENT' | 'ADMIN' = '';
  filterActive: '' | 'ACTIVE' | 'INACTIVE' = '';

  // tri front
  sortField: SortField = 'createdAt';
  sortDirection: SortDirection = 'desc';

  // édition de rôle
  selectedUserForRole: AdminUserSummary | null = null;
  selectedRole: AdminUserSummary['role'] | '' = '';
  roleErrorMessage: string | null = null;
  roleSuccessMessage: string | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = this.page): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.actionErrorMessage = null;

    // Service adjusted to return array, ignoring page/size params
    this.userService.getAdminUsers().subscribe({
      next: (response) => {
        // Backend now returns AdminUserSummary[] directly (no pagination wrapper)
        this.allUsers = response;

        // Mock pagination for frontend compatibility if needed, or just show all
        this.totalElements = response.length;
        this.totalPages = 1;

        this.users = this.applyFiltersAndSort(this.allUsers);
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs admin', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage =
            "Vous n'êtes pas autorisé à consulter la liste des utilisateurs.";
        } else {
          this.errorMessage =
            'Impossible de charger la liste des utilisateurs.';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    if (!this.allUsers) return;
    this.users = this.applyFiltersAndSort(this.allUsers);
  }

  onSortChange(): void {
    this.onFilterChange();
  }

  private applyFiltersAndSort(list: AdminUserSummary[]): AdminUserSummary[] {
    let result = [...list];

    // filtre email / nom
    const term = this.filterEmail.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          u.fullName.toLowerCase().includes(term)
      );
    }

    // filtre rôle
    if (this.filterRole) {
      result = result.filter((u) => u.role === this.filterRole);
    }

    // filtre actif/inactif
    if (this.filterActive === 'ACTIVE') {
      result = result.filter((u) => u.active);
    } else if (this.filterActive === 'INACTIVE') {
      result = result.filter((u) => !u.active);
    }

    // tri
    result.sort((a, b) => {
      let cmp = 0;

      switch (this.sortField) {
        case 'fullName':
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'role':
          cmp = a.role.localeCompare(b.role);
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
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) return;
    this.loadUsers(page);
  }

  getStatusLabel(user: AdminUserSummary): string {
    return user.active ? 'Actif' : 'Inactif';
  }

  getStatusClass(user: AdminUserSummary): string {
    return user.active ? 'badge-success' : 'badge-muted';
  }

  onToggleActive(user: AdminUserSummary, enable: boolean): void {
    this.actionErrorMessage = null;

    const actionLabel = enable ? 'activer' : 'désactiver';
    const confirmed = window.confirm(
      `Voulez-vous vraiment ${actionLabel} le compte de ${user.fullName} (${user.email}) ?`
    );

    if (!confirmed) {
      return;
    }

    const request$ = enable
      ? this.userService.enableUser(user.id)
      : this.userService.disableUser(user.id);

    request$.subscribe({
      next: () => {
        // mise à jour locale
        user.active = enable;

        const idx = this.allUsers.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          this.allUsers[idx].active = enable;
        }
        this.users = this.applyFiltersAndSort(this.allUsers);
      },
      error: (err) => {
        console.error('Erreur changement statut utilisateur', err);

        if (err.status === 401 || err.status === 403) {
          this.actionErrorMessage =
            "Vous n'avez pas les droits pour modifier le statut de cet utilisateur.";
        } else {
          this.actionErrorMessage =
            'Une erreur est survenue lors du changement de statut. Veuillez réessayer.';
        }
      }
    });
  }

  openRoleModal(user: AdminUserSummary): void {
    this.selectedUserForRole = user;
    this.selectedRole = user.role;
    this.roleErrorMessage = null;
    this.roleSuccessMessage = null;
  }

  closeRoleModal(): void {
    this.selectedUserForRole = null;
    this.selectedRole = '';
  }

  saveRole(): void {
    this.roleErrorMessage = null;
    this.roleSuccessMessage = null;

    if (!this.selectedUserForRole) {
      return;
    }

    if (!this.selectedRole) {
      this.roleErrorMessage = 'Veuillez sélectionner un rôle.';
      return;
    }

    if (this.selectedRole === this.selectedUserForRole.role) {
      this.roleErrorMessage = 'Le rôle est déjà attribué à cet utilisateur.';
      return;
    }

    const newRole = this.selectedRole as AdminUserSummary['role'];

    this.userService
      .updateUserRole(this.selectedUserForRole.id, newRole)
      .subscribe({
        next: () => {
          // mise à jour locale
          this.selectedUserForRole!.role = newRole;

          const idx = this.allUsers.findIndex(
            (u) => u.id === this.selectedUserForRole!.id
          );
          if (idx !== -1) {
            this.allUsers[idx].role = newRole;
          }
          this.users = this.applyFiltersAndSort(this.allUsers);

          this.roleSuccessMessage = 'Le rôle a été mis à jour avec succès.';
          this.closeRoleModal();
        },
        error: (err) => {
          console.error('Erreur mise à jour rôle utilisateur', err);

          if (err.status === 401 || err.status === 403) {
            this.roleErrorMessage =
              "Vous n'avez pas les droits pour modifier le rôle de cet utilisateur.";
          } else {
            this.roleErrorMessage =
              'Une erreur est survenue lors de la mise à jour du rôle. Veuillez réessayer.';
          }
        }
      });
  }
}