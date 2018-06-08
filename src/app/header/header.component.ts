import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { NavigationStateService } from '../navigation/navigation-state.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  public isTrainer: boolean = false;
  public userTypeSubscription: Subscription;
  public userAuthenticated: boolean = false;
  public authenticationSubscription: Subscription;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private navigationStateService: NavigationStateService
  ) { }

  ngOnInit() {
    // Determine if user has been authenticated
    this.authenticationSubscription = this.authService.userAuthenticationStatus.subscribe((authID: string) => {
      if (authID === 'logout') {
        this.userAuthenticated = false;
      } else {
        this.userAuthenticated = true;
      }
    });
    this.authService.checkUserAuthenticationStatus();
    // Determine user type
    if (this.navigationStateService.getUserType() == 'trainer') this.isTrainer = true;
    this.userTypeSubscription = this.navigationStateService.userTypeUpdated.subscribe((userType: string) => {
      if (userType == 'trainer') this.isTrainer = true;
    });
  }

  ngOnDestroy() {
    if (this.userTypeSubscription) this.userTypeSubscription.unsubscribe();
  }

  public onLogout() {
    this.router.navigate(['/login'], { queryParams: { logout: 'true' } });
  }

}
