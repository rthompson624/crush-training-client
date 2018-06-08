export class Survey {
  public id: string;
  public userID: string;
  public trainerID: string;
  public date: Date;
  public status: string;
  public submittedDate: Date;
  public sleepRating: number;
  public nutritionRating: number;
  public movementRating: number;
  public hydrationRating: number;
  public stressLevel: number = 0;
  public minutesWalking: number = 0;
  
  constructor(userID: string, date: Date, status: string) {
    this.userID = userID;
    this.date = date;
    this.status = status;
  }

  convertToDBObject() {
    let dbObject = {
      userID: this.userID, 
      trainerID: this.trainerID, 
      date: this.date, 
      status: this.status, 
      submittedDate: this.submittedDate, 
      sleepRating: this.sleepRating,
      nutritionRating: this.nutritionRating,
      movementRating: this.movementRating,
      hydrationRating: this.hydrationRating,
      stressLevel: this.stressLevel,
      minutesWalking: this.minutesWalking
    };
    return dbObject;
  }
}