import { Exercise } from './exercise.model';

export class Segment {
  public id: string;
  public order: string;
  public type: string;
  public exercises: Exercise[] = [];
  public circuitName: string;
  public circuitDescription: string;
  public circuitResult: string;

  constructor(id: string, order: string, type: string, circuitName: string, circuitDescription: string, circuitResult: string) {
    this.id = id;
    this.order = order;
    this.type = type;
    this.circuitName = circuitName;
    this.circuitDescription = circuitDescription;
    this.circuitResult = circuitResult;
  }

  public convertToDBObject() {
    let dbObject = {
      order: this.order, 
      type: this.type, 
      circuitName: this.circuitName, 
      circuitDescription: this.circuitDescription, 
      circuitResult: this.circuitResult
    };
    return dbObject;
  }
}