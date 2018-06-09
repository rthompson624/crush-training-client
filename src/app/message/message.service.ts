import { Injectable, EventEmitter, Output } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from './message.model';

@Injectable()
export class MessageService {
  @Output() unreadMessageCountEvent: EventEmitter<number> = new EventEmitter<number>();

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public getMessages(clientID: string, userID: string): Observable<Message[]> {
    // Request data from db. Don't need to listen for response because view will consume it.
    let messageCol: AngularFirestoreCollection<Message>;
    let messages: Observable<Message[]>;
    messageCol = this.afs.collection('message', ref => ref.where('clientID', '==', clientID).orderBy('date', 'asc'));
    messages = messageCol.snapshotChanges().pipe(map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Message;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            if ((data.toUserID == userID) && !data.viewed) this.markMessageAsViewed(data);
            return data;
          }
        );
      }
    ));
    return messages;
  }

  public addMessage(message: Message): void {
    this.afs.collection('message').add(message.convertToDBObject());
  }

  private markMessageAsViewed(message: Message): void {
    message.viewed = true;
    this.afs.collection('message').doc(message.id).update({viewed: true});
  }

  public unreadMessageCount(clientID: string, receiverID: string): void {
    let messageCol: AngularFirestoreCollection<Message>;
    let messages: Observable<Message[]>;
    // Send query request to database
    messageCol = this.afs.collection('message', ref => ref.where('clientID', '==', clientID).where('toUserID', '==', receiverID).where('viewed', '==', false));
    messages = messageCol.valueChanges();
    // Listen for response
    messages.forEach((ary: Message[]) => {
      // Fire notification
      this.unreadMessageCountEvent.emit(ary.length);
    });
  }

  public getTrainersUnreadMessages(trainerID: string): Observable<Message[]> {
    // Request data from db.
    let messageCol: AngularFirestoreCollection<Message>;
    let messages: Observable<Message[]>;
    messageCol = this.afs.collection('message', ref => ref.where('toUserID', '==', trainerID).where('viewed', '==', false).orderBy('clientID', 'asc'));
    messages = messageCol.snapshotChanges().pipe(map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Message;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    ));
    return messages;
  }

  private convertFirestoreTimestampsToDates(myObject: object): void {
    for (let propertyName in myObject) {
      if (myObject.hasOwnProperty(propertyName)) {
        if (myObject[propertyName]) {
          if (typeof myObject[propertyName].toDate === 'function') {
            myObject[propertyName] = myObject[propertyName].toDate();
          }
        }
      }
    }
  }

}
