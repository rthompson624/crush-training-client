import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PaymentService } from '../payment.service';
import { StripeSubscription } from '../stripe-subscription.model';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-subscription-edit',
  templateUrl: './subscription-edit.component.html',
  styleUrls: ['./subscription-edit.component.css']
})
export class SubscriptionEditComponent implements OnInit, OnDestroy {
  public user: User;
  public plans: any[] = environment.stripePlans;
  public selectedPlan: string;
  public disableCheckoutButton: boolean = true;
  public displayUpdateConfirmation: boolean = false;
  public displayDeleteConfirmation: boolean = false;
  public displayGoodbye: boolean = false;

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
    }
  }

  ngOnDestroy() {
  }

  public changeSubscription(): void {
    this.paymentService.changeSubscriptionPlan(this.user.id, this.selectedPlan, this.getPlanID(this.selectedPlan));
    this.displayUpdateConfirmation = true;
    this.disableCheckoutButton = true;
  }

  public cancelSubscription(): void {
    this.paymentService.cancelSubscription(this.user.id);
    this.displayDeleteConfirmation = false;
    this.displayGoodbye = true;
    this.disableCheckoutButton = true;
  }

  public getPlanID(plan: string): string {
    let planID: string;
    for (let i = 0; i < this.plans.length; i++) {
      if (plan == this.plans[i][0]) planID = this.plans[i][3];
    }
    return planID;
  }

  public formatDate(date: Date): string {
    const options = {month:'long', day:'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

}
