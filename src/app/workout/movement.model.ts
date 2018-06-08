export class Movement {
  public id: string;
  public name: string;
  public youtubeID: string;
  public source: string;

  constructor(id: string, name: string, youtubeID: string, source: string) {
    this.id = id;
    this.name = name;
    this.youtubeID = youtubeID;
    this.source = source;
   }

  public convertToDBObject() {
    let dbObject = {
      name: this.name, 
      youtubeID: this.youtubeID, 
      source: this.source
    };
    return dbObject;
  }
}