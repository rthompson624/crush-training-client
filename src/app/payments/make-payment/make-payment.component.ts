import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentReference } from '@firebase/firestore-types';
import { Observable ,  Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentService } from '../payment.service';
import { StripeSubscription } from '../stripe-subscription.model';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.css']
})
export class MakePaymentComponent implements OnInit, OnDestroy {
  public user: User;
  public handler: any;
  public plans: any[] = environment.stripePlans;
  public selectedPlan: string;
  public disableCheckoutButton: boolean = false;
  public subscriptionObs: Observable<StripeSubscription>;
  public subscriptionSubscription: Subscription;

  constructor(
    private router: Router, 
    private paymentService: PaymentService, 
    private userService: UserService
  ) { }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.selectedPlan = this.user.plan;
      this.handler = StripeCheckout.configure({
        key: environment.stripeKey,
        image: '/assets/images/crush_logo.jpg',
        locale: 'auto',
        allowRememberMe: false,
        token: token => {
          this.disableCheckoutButton = true;
          let subscription: StripeSubscription = new StripeSubscription(this.user.id, this.user.stripeCustomerID, this.selectedPlan, this.getPlanID(this.selectedPlan), token.id);
          this.paymentService.submitSubscription(subscription)
          .then((doc: DocumentReference) => {
            // A subscription record has now been created in database.
            // A database-triggered cloud function submits the subscription to Stripe.
            // If the subscription is successful the field subscription.stripeSubscriptionID will be updated.
            // We need to listen to this field, and respond with a confirmation.
            this.subscriptionObs = this.paymentService.getSubscription(doc.id);
            // Reload user so updated subscription status is reflected
            this.subscriptionSubscription = this.subscriptionObs.subscribe(subscription => {
              if (subscription.stripeSubscriptionID) this.userService.reloadActiveUser();
            });
          });
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.subscriptionSubscription) this.subscriptionSubscription.unsubscribe();
  }

  public handlePayment() {
    this.handler.open({
      name: 'Crush Training',
      description: this.selectedPlan + ' Subscription',
      amount: this.getPrice(this.selectedPlan)
    });
  }

  public getPrice(plan: string): number {
    let price: number;
    for (let i = 0; i < this.plans.length; i++) {
      if (plan == this.plans[i][0]) price = this.plans[i][2];
    }
    return price;
  }

  public getPlanID(plan: string): string {
    let planID: string;
    for (let i = 0; i < this.plans.length; i++) {
      if (plan == this.plans[i][0]) planID = this.plans[i][3];
    }
    return planID;
  }

  @HostListener('window:popstate') onPopstate() {
    this.handler.close();
  }

}
