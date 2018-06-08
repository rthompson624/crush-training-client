export class Message {
  public id: string;
  public date: Date;
  public messageText: string;
  public fromUserID: string;
  public toUserID: string;
  public viewed: boolean;
  public clientID: string;

  constructor(id: string, date: Date, messageText: string, fromUserID: string, toUserID: string, viewed: boolean, clientID: string) {
    this.id = id;
    this.date = date;
    this.messageText = messageText;
    this.fromUserID = fromUserID;
    this.toUserID = toUserID;
    this.viewed = viewed;
    this.clientID = clientID;
  }

  convertToDBObject() {
    return {
      date: this.date, 
      messageText: this.messageText, 
      fromUserID: this.fromUserID, 
      toUserID: this.toUserID, 
      viewed: this.viewed, 
      clientID: this.clientID
    };
  }
}


