import { Segment } from './segment.model';

export class Workout {
  public id: string;
  public assignmentDate: Date;
  public status: string;
  public submittedDate: Date;
  public userID: string;
  public segments: Segment[] = [];
  public meetingType: string;
  public trainerID: string;
  public userName: string;
  public selected: boolean = false;

  constructor(id: string, assignmentDate: Date, status: string, submittedDate: Date, userID: string, trainerID: string) {
    this.id = id;
    this.assignmentDate = assignmentDate;
    this.status = status;
    this.submittedDate = submittedDate;
    this.userID = userID;
    this.meetingType = 'inperson';
    this.trainerID = trainerID;
  }

  public convertToDBObject() {
    return {
      assignmentDate: this.assignmentDate, 
      status: this.status, 
      submittedDate: this.submittedDate, 
      userID: this.userID, 
      meetingType: this.meetingType, 
      trainerID: this.trainerID, 
      userName: this.userName
    }
  }
}