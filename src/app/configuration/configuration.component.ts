import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { PaymentService } from '../payments/payment.service';
import { StripeSubscription} from '../payments/stripe-subscription.model';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  public user: User;
  public trainerSubscription: StripeSubscription = null;
  public subscriptionSubscription: Subscription;

  constructor(
    private router: Router, 
    private userService: UserService, 
    private paymentService: PaymentService
  ) { }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.loadUserDependentResources();
    }
  }

  ngOnDestroy() {
    if (this.subscriptionSubscription) this.subscriptionSubscription.unsubscribe();
  }

  public loadUserDependentResources() {
    this.subscriptionSubscription = this.paymentService.getTrainerSubscription(this.user.id).subscribe(subscriptions => {
      if (subscriptions.length > 0) this.trainerSubscription = subscriptions[0];
    });
  }

}
