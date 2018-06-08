export class UserMovementHistory {
  public id: string;
  public userID: string;
  public date: Date;
  public movement: string;
  public movementID: string;
  public reps: number;
  public sets: number;
  public weight: number;
  public repsLastSet: number;
  public oneRepMax: number;

  constructor(id: string, userID: string, date: Date, movement: string, movementID: string, reps: number, sets: number, weight: number, repsLastSet: number) {
    this.id = id;
    this.userID = userID;
    this.date = date;
    this.movement = movement;
    this.movementID = movementID;
    this.reps = reps;
    this.sets = sets;
    this.weight = weight;
    this.repsLastSet = repsLastSet;
  }

  convertToDBObject() {
    let dbObject = {
      userID: this.userID, 
      date: this.date, 
      movement: this.movement, 
      movementID: this.movementID, 
      reps: this.reps, 
      sets: this.sets, 
      weight: this.weight, 
      repsLastSet: this.repsLastSet
    };
    return dbObject;
  }
  
}