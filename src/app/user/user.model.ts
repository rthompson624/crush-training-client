export class User {
  public id: string;
  public authenticationUID: string;
  public email: string;
  public type: string;
  public nameFirst: string;
  public nameLast: string;
  public trainerID: string;
  public city: string;
  public state: string;
  public country: string;
  public phone: string;
  public birthday: Date;
  public gender: string;
  public height: number;
  public initialWeight: number;
  public weight: number;
  public outcome: string;
  public outcomeReason: string;
  public hasProfilePic: boolean;
  public picUrl: any;
  public status: string;
  public dateCreated: Date;
  public organizationID: string;
  public oneRepMaxMovementID: string;
  public bodyCompImplemented: boolean;
  public bodyCompMeasurementDayOfWeek: number;
  public plan: string;
  public planExpiration: Date;
  public stripeCustomerID: string;
  
  constructor(id: string, authenticationUID: string, email: string, type: string, nameFirst: string, nameLast: string, trainerID: string) {
    this.id = id;
    this.authenticationUID = authenticationUID;
    this.email = email;
    this.type = type;
    this.nameFirst = nameFirst;
    this.nameLast = nameLast;
    this.trainerID = trainerID;
  }

}