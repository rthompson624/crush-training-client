import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStateService } from '../../navigation/navigation-state.service';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DataListModule } from 'primeng/datalist';
import { AngularFireStorage } from 'angularfire2/storage';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectItem } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit, OnDestroy {
  public user: User;
  public clients: User[];
  public displayClients: User[] = [];
  public clientsSubscription: Subscription;
  public statusTypes: SelectItem[];
  public selectedStatus: string = 'active';

  constructor(
    private router: Router, 
    private userService: UserService, 
    private navigationStateService: NavigationStateService, 
    private afStorage: AngularFireStorage
  ) {
    this.statusTypes = [
      {label: 'Active', value: 'active'}, 
      {label: 'Inactive', value: 'inactive'}
    ];
  }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.loadUserDependentResources();
    }
  }

  ngOnDestroy() {
    if (this.clientsSubscription) this.clientsSubscription.unsubscribe();
  }

  public loadUserDependentResources() {
    this.clientsSubscription = this.userService.getClients(this.user.id).subscribe(clients => {
      this.clients = clients;
      for (let i = 0; i < this.clients.length; i++) {
        if (this.clients[i].hasProfilePic) {
          this.clients[i].picUrl = this.afStorage.ref('user/profile/' + this.clients[i].id + '.jpg').getDownloadURL();
        }
      }
      this.loadDisplayClients();
    });
  }

  public loadDisplayClients(): void {
    this.displayClients.length = 0;
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].status == this.selectedStatus) this.displayClients.push(this.clients[i]);
    }
  }

  public onChangeStatus(): void {
    this.loadDisplayClients();
  }

  public onSelectMessage(client: User): void {
    this.userService.setActiveClient(client);
    this.router.navigate(['/', 'messages']);
  }

  public onSelectClient(client: User): void {
    this.userService.setActiveClient(client);
    this.router.navigate(['/', 'profile']);
  }

  public onSelectProgress(client: User): void {
    this.userService.setActiveClient(client);
    this.router.navigate(['/', 'progress']);
  }

  public onSelectViewCalendar(client: User): void {
    this.userService.setActiveClient(client);
    this.navigationStateService.calendarView = 'single-client';
    this.router.navigate(['/', 'calendar']);
  }

  public clientSignupLink(): string {
    return 'https://' + environment.appServerDomain + '/signup?trainer=' + this.user.id;
  }

}
