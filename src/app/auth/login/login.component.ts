import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { NavigationStateService } from '../../navigation/navigation-state.service';
import { Router, ActivatedRoute } from '@angular/router';

import { User } from '../../user/user.model';
import { Subscription } from 'rxjs';
import { UserService } from '../../user/user.service';
import { LifestyleService } from '../../lifestyle/lifestyle.service';
import { WorkoutService } from '../../workout/workout.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Validators, FormControl, FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit, OnDestroy {
  public user: User;
  public loginFailed: boolean = false;
  public loginFailedMessage: string = null;
  public activeUserSubscription: Subscription;
  public userform: FormGroup;
  public pageTimer: number;
  public userAuthenticated: boolean = false;
  public authenticationUID: string;
  public authenticationSubscription: Subscription;
  public displayForgotPasswordDialog: boolean = false;
  public forgottenPasswordEmail: string;
  public disableResetButton: boolean = true;
  public emailSent: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private navigationStateService: NavigationStateService, 
    private userService: UserService, 
    private route: ActivatedRoute, 
    private lifestyleService: LifestyleService, 
    private workoutService: WorkoutService, 
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.userform = this.fb.group({
      'email': new FormControl('', Validators.required),
      'password': new FormControl('', Validators.required)
    });
    this.route.queryParams.subscribe(params => {
      if (params['logout'] == 'true') {
        this.onLogout();
      }
    });
    // Determine if user has been authenticated
    this.authenticationSubscription = this.authService.userAuthenticationStatus.subscribe((authID: string) => {
      if (authID === 'logout') {
        this.userAuthenticated = false;
      } else {
        this.userAuthenticated = true;
        this.authenticationUID = authID;
        this.loadAuthenticatedUser();
      }
    });
    this.authService.checkUserAuthenticationStatus();
  }

  ngOnDestroy() {
    if (this.activeUserSubscription) this.activeUserSubscription.unsubscribe();
    if (this.authenticationSubscription) this.authenticationSubscription.unsubscribe();
  }

  public onLogout(): void {
    this.lifestyleService.cleanUp();
    this.workoutService.cleanUp();
    this.userService.cleanUp();
    this.user = null;
    this.authService.logoutUser();
    // Following line is to remedy the "Missing or insufficient permissions" that occur on logout
    // window.location.href = '/login';
    // window.location.reload();
  }

  public onLogin(): void {
    const email = this.userform.get('email').value;
    const password = this.userform.get('password').value;
    let retPromise = this.authService.loginUser(email, password);
    retPromise.then((authUser: any) => {
      this.authenticationUID = authUser.uid;
      this.loginFailed = false;
      this.loginFailedMessage = null;
      this.loadAuthenticatedUser();
    })
    .catch(error => {
      this.loginFailed = true;
      switch(error.code) {
        case 'auth/wrong-password':
          this.loginFailedMessage = 'Incorrect password entered.';
          break;
        case 'auth/user-not-found':
          this.loginFailedMessage = 'No account exists for that email.';
          break;
        case 'auth/invalid-email':
          this.loginFailedMessage = 'Email not of valid format.';
          break;
        default:
          this.loginFailedMessage = error.code + ' :: ' + error.message;
      }
    });
  }

  public loadAuthenticatedUser(): void {
    this.activeUserSubscription = this.userService.activeUserUpdated.subscribe(
      (user: User) => {
        this.user = user;
        if (this.user.status == 'active') {
          this.navigationStateService.setUserType(user.type);
          if (this.user.type == 'client') {
            this.router.navigate(['/', 'dashboard']);
          } else if (this.user.type = 'trainer') {
            this.router.navigate(['/', 'dashboard-trainer']);
          } else {
            // Reserving this condition for building in admin user functionality
            console.log('LoginComponent::onLogin() - user.type not recognized (' + this.user.type + ')');
          }
        } else {
          this.onLogout();
          this.loginFailed = true;
          this.loginFailedMessage = 'The account you entered is no longer active. Please contact your trainer to reactivate it.'
        }
      }
    );
    this.userService.loadAuthenticatedUser(this.authenticationUID);
  }

  public resetSubmitError(): void {
    this.loginFailed = false;
    this.loginFailedMessage = null;
  }

  public isUserLoggedIn(): boolean {
    return this.userAuthenticated;
  }

  public onClickForgotPassword(): void {
    this.forgottenPasswordEmail = this.userform.get('email').value;
    this.validateEmail();
    this.displayForgotPasswordDialog = true;
  }

  public onClickResetPassword(): void {
    this.emailSent = true;
    this.disableResetButton = true;
    this.authService.sendPasswordResetEmail(this.forgottenPasswordEmail);
  }

  public onDismissForgotPasswordDialog(): void {
    this.emailSent = false;
    this.disableResetButton = false;
  }

  public validateEmail(): void {
    if ((this.forgottenPasswordEmail.indexOf('@') >= 0) && (this.forgottenPasswordEmail.indexOf('.') >= 0)) {
      this.disableResetButton = false;
    }
  }

}