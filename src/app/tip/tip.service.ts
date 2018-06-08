import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Tip } from './tip.model';

@Injectable()
export class TipService {

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public getAllTips(trainerID: string): Observable<Tip[]> {
    // Request data from db.
    let tipCol: AngularFirestoreCollection<Tip>;
    let tips: Observable<Tip[]>;
    tipCol = this.afs.collection('tip', ref => ref.where('trainerID', '==', trainerID).orderBy('startDate', 'desc'));
    tips = tipCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Tip;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return tips;
  }

  public getTipForToday(trainerID: string): Observable<Tip[]> {
    // Request data from db.
    let tipCol: AngularFirestoreCollection<Tip>;
    let tips: Observable<Tip[]>;
    let today = new Date();
    today = new Date(today.toDateString());
    tipCol = this.afs.collection('tip', ref => ref.where('trainerID', '==', trainerID).where('startDate', '==', today));
    tips = tipCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Tip;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return tips;
  }

  public addTip(tip: Tip): void {
    this.afs.collection('tip').add(tip.convertToDBObject());
  }

  public updateTip(tip: Tip): void {
    this.afs.collection('tip').doc(tip.id).update({ tipText: tip.tipText, startDate: tip.startDate });
  }

  public updateTipDate(id: string, date: Date): void {
    this.afs.collection('tip').doc(id).update({ startDate: date });
  }

  public deleteTip(tip: Tip): void {
    this.afs.doc('tip/' + tip.id).delete();
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
