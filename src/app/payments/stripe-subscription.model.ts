export class StripeSubscription {
  public id: string;
  public userID: string;
  public stripeCustomerID: string;
  public date: Date;
  public plan: string;
  public stripePlanID: string;
  public token: string;
  public stripeSubscriptionID: string;
  public subscriptionError: string;
  public cancelled: boolean;

  constructor(userID: string, stripeCustomerID: string, plan: string, stripePlanID: string, token: string) {
    this.id = null;
    this.userID = userID;
    this.stripeCustomerID = stripeCustomerID;
    this.date = new Date();
    this.plan = plan;
    this.stripePlanID = stripePlanID;
    this.token = token;
    this.stripeSubscriptionID = null;
    this.subscriptionError = null;
    this.cancelled = false;
  }

}