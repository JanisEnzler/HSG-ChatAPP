import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { User } from '../shared/models/user';
import { FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Token } from '@angular/compiler';
import { Router } from '@angular/router';

@Component({
  selector: 'app-group-editor',
  host: { 'class': 'group-container' },
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './group-editor.component.html',
  styleUrl: './group-editor.component.css'
})
export class GroupEditorComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  users: User[] = [];
  userId: string = '';
  filteredUsers: User[] = [];
  selectedMembers: User[] = [];
  errorMessage: string | null = null;
  groupName: string = '';

  groupForm: FormGroup = this.fb.group({
    name: [''],
    memberSearch: ['']
  });

  ngOnInit(): void {
    // make api request and wait for the user to be set
    this.apiService.validateToken().subscribe(user => {
      this.userId = user.user_id;
      if (this.userId) {
        this.apiService.getUsers().subscribe(users => {
          this.users = users.filter(user => user.user_id !== this.userId);
          console.log(this.users);
        });
      }
    });

    

    this.groupForm.get('memberSearch')!.valueChanges.subscribe(value => {
      this.filterUsers(value);
      console.log(value);
    });

    this.groupForm.get('name')!.valueChanges.subscribe(value => {
      this.groupName = value;
      console.log(value);
    });
  }


  filterUsers(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredUsers = [];
      return;
    }
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) && !this.selectedMembers.includes(user)
    );
  
    console.log(this.filteredUsers);
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 10000); // 10 seconds
  }

  addMember(user: User): void {
    if (!this.selectedMembers.includes(user)) {
      this.selectedMembers.push(user);
    }
    this.groupForm.get('memberSearch')!.setValue('');
    this.filteredUsers = [];
  }

  removeMember(user: User): void {
    this.selectedMembers = this.selectedMembers.filter(u => u !== user);
  }

  onSubmit(): void {
    const groupName = this.groupForm.get('name')!.value;
    const userIds = this.selectedMembers.map(user => user.user_id);
    this.createGroup(groupName, userIds);
  }

  createGroup(groupName: string, userIds: string[]): void {
    this.apiService.createGroup(groupName, userIds).subscribe({
      next: response => {
        console.log('Group created', response);
        this.router.navigate(['/chat']);
      },
      error: error => {
        console.error('Group creation failed', error);
        this.showError(error.error || 'An error occurred during login.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/chat']);
  }
}
