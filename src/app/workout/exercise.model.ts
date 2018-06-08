import { Movement } from './movement.model';

export class Exercise {
  public id: string;
  public order: number;
  public movementID: string;
  public movement: string;
  public sets: number;
  public reps: number;
  public weight: number;
  public repsLastSet: number = 0;
  public movementSelection: Movement;

  constructor(id: string, order: number, movementID: string, movement: string, sets: number, reps: number, weight: number) {
    this.id = id;
    this.order = order;
    this.movementID = movementID;
    this.movement = movement;
    this.sets = sets;
    this.reps = reps;
    this.weight = weight;
  }

  public convertToDBObject() {
    let dbObject = {
      order: this.order, 
      movementID: this.movementID, 
      movement: this.movement, 
      sets: this.sets, 
      reps: this.reps, 
      weight: this.weight, 
      repsLastSet: this.repsLastSet
    };
    return dbObject;
  }
}