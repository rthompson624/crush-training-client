export class Organization {
  public id: string;
  public name: string;
  public plan: string;
  public planExpiration: Date;
  
  constructor(name: string) {
    this.name = name;
  }

}