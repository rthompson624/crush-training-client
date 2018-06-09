import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs';

import { BodyCompMeasurement } from './body-comp-measurement.model';

@Injectable()
export class ProgressService {

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public getBodyCompMeasurements(userID: string, start: Date, end: Date): Observable<BodyCompMeasurement[]> {
    let recordsCol: AngularFirestoreCollection<BodyCompMeasurement>;
    let recordsObs: Observable<BodyCompMeasurement[]>;
    // Send query request to database
    recordsCol = this.afs.collection('bodyCompMeasurement', ref => ref.where('userID', '==', userID).where('date', '>=', start).where('date', '<=', end).orderBy('date', 'asc'));
    recordsObs = recordsCol.valueChanges();
    return recordsObs;
  }

  public createBodyCompMeasurement(bodyComp: BodyCompMeasurement): void {
    this.afs.collection('bodyCompMeasurement').add(bodyComp.convertToDBObject());
  }

}
