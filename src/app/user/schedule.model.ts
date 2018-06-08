export class Schedule {
  public id: string;
  public dayOfWeek: number;
  public hour: number;
  public meetingType: string;
  public minute: number;
  public userID: string;
  public displayTime: Date;

  constructor() {
  }

  public convertToDBObject() {
    return {
      dayOfWeek: this.dayOfWeek, 
      hour: this.hour, 
      meetingType: this.meetingType, 
      minute: this.minute, 
      userID: this.userID
    };
  }

}