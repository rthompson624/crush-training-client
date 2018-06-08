export class Tip {
  public id: string;
  public trainerID: string;
  public tipText: string;
  public startDate: Date;

  constructor(id: string) {
    this.id = id;
  }

  convertToDBObject() {
    return {
      trainerID: this.trainerID,
      tipText: this.tipText,
      startDate: this.startDate
    };
  }

}