export class Payment {
  public id: string;
  public userID: string;
  public date: Date;
  public plan: string;
  public price: number;
  public token: string;
  public chargeID: string;
  public chargeError: string;

  constructor(userID: string, plan: string, price: number, token: string) {
    this.id = null;
    this.userID = userID;
    this.date = new Date();
    this.plan = plan;
    this.price = price;
    this.token = token;
    this.chargeID = null;
    this.chargeError = null;
  }

}