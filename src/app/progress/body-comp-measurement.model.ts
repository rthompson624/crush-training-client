export class BodyCompMeasurement {
  public id: string;
  public userID: string;
  public date: Date;
  public weight: number;
  public abdominalFat: number;
  public waistCircumference: number;
  public progressPic: string;
  public picUrl: any;

  constructor() {
  }

  convertToDBObject() {
    return {
      userID: this.userID, 
      date: this.date, 
      weight: this.weight, 
      abdominalFat: this.abdominalFat, 
      waistCircumference: this.waistCircumference, 
      progressPic: this.progressPic
    };
  }
  
}