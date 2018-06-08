import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { DocumentReference } from '@firebase/firestore-types';
import { User } from '../../user/user.model';
import { Subscription } from 'rxjs/Subscription';
import { UserService } from '../../user/user.service';
import { NavigationStateService } from '../../navigation/navigation-state.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Validators, FormControl, FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup-trainer',
  templateUrl: './signup-trainer.component.html',
  styleUrls: ['./signup-trainer.component.css']
})
export class SignupTrainerComponent implements OnInit, OnDestroy {
  public signupFailed: boolean = false;
  public signupFailedMessage: string = null;
  public user: User;
  public userform: FormGroup;
  public activeUserSubscription: Subscription;
  public organizationID: string;
  public validUrl: boolean = true;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private userService: UserService, 
    private navigationStateService: NavigationStateService, 
    private route: ActivatedRoute, 
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.userform = this.fb.group({
      'nameFirst': new FormControl('', Validators.required),
      'nameLast': new FormControl('', Validators.required),
      'email': new FormControl('', Validators.compose([Validators.required, Validators.email])),
      'password': new FormControl('', Validators.compose([Validators.required, Validators.minLength(6)]))
    });
    // Get organization ID from url
    this.route.queryParams.filter(params => params.organization).subscribe(params => {
      this.organizationID = params.organization;
      this.validUrl = this.isOrganizationIDValid(this.organizationID);
    });
  }

  ngOnDestroy() {
    if (this.activeUserSubscription) this.activeUserSubscription.unsubscribe();
  }

  public onSignup() {
    const nameFirst = this.userform.get('nameFirst').value;
    const nameLast = this.userform.get('nameLast').value;
    const email = this.userform.get('email').value;
    const password = this.userform.get('password').value;
    this.authService.signupUser(email, password).then(response => {
      this.signupFailed = false;
      this.signupFailedMessage = null;
      // Need to create new UserService method for creating a trainer
      this.userService.createNewTrainer(response.uid, email, nameFirst, nameLast, this.organizationID).then((docRef: DocumentReference) => {
        this.loadAuthenticatedUser(response.uid);
      }).catch(error => {
        console.log('Error creating trainer: ' + error);
      });
    }).catch(error => {
      this.signupFailed = true;
      switch(error.code) {
        case 'auth/email-already-in-use':
          this.signupFailedMessage = 'An account for that email already exists.';
          break;
        case 'auth/invalid-email':
          this.signupFailedMessage = 'The email entered is not of a proper format.';
          break;
        default:
          this.signupFailedMessage = error.code + ' :: ' + error.message;
      }
    });
  }

  public loadAuthenticatedUser(authenticationUID: string): void {
    this.activeUserSubscription = this.userService.activeUserUpdated.subscribe(
      (user: User) => {
        this.user = user;
        this.navigationStateService.setUserType(user.type);
        this.router.navigate(['/', 'dashboard-trainer']);
      }
    );
    this.userService.loadAuthenticatedUser(authenticationUID);
  }

  public isOrganizationIDValid(id: string): boolean {
    let valid = false;
    if (id) {
      if (id.length == 20) valid = true;
    }
    return valid;
  }

}
