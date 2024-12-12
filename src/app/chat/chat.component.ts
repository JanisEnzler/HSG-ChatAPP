import { ChatBarComponent } from '../chat-bar/chat-bar.component';
import { ChatHistoryComponent } from '../chat-history/chat-history.component';
import { ApiService } from '../api.service';
import { Component, Input, ViewChild, DestroyRef, ElementRef, inject} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, finalize, catchError, EMPTY } from 'rxjs';
import { Group } from '../shared/models/group';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-chat',
  host: { 'class': 'chat-container' },
  standalone: true,
  imports: [ChatBarComponent, ChatHistoryComponent, NgClass],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {

  private intervalId?: any;
  private destroyRef = inject(DestroyRef);
  private apiService = inject(ApiService );
  private router = inject(Router);
  private pollInterval = 5000;

  groups: Group[] = [];
  errorMessage!: string;
  selectedGroup?: string;

  ngOnInit(): void {
    this.getGroups();

    this.intervalId = setInterval(() => {
      this.getGroups();
    }, this.pollInterval);
  }

  private getGroups(): void {
    this.apiService.getUserGroups()
      .pipe(
        tap((response: Group[]) => {
          // Check if the response contains any new messages
          if (response.length === this.groups.length) {
            return;
          }
          this.groups = response;
          // if the currently selected group is not in the list of groups, reset the selected group
          if (this.selectedGroup && !this.groups.find(group => group.group_id === this.selectedGroup)) {
            this.selectedGroup = undefined;
          }
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((error: Error) => {
          this.errorMessage = error.message;
          console.error(error);
          return EMPTY;
        }),
        finalize(() => console.log('done!'))
      )
      .subscribe();
  }

  selectGroup(group: Group): void {
    console.log('Selected group:', group.group_name);
    // update history and chat bar with the selected group
    this.selectedGroup = group.group_id;
  }

  goToGroupEditor(): void {
    this.router.navigate(['/group-editor']);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
