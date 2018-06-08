import { Injectable, EventEmitter, Output } from '@angular/core';
import { Survey } from './survey.model';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class LifestyleService {
  private activeSurvey: Survey;
  @Output() activeSurveyUpdated: EventEmitter<Survey> = new EventEmitter<Survey>();

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public getActiveSurvey(userID: string): Survey {
    // Check if app is initializing.
    if (!this.activeSurvey) {
      // Check the database for a submitted survey. Will fire activeSurveyUpdated event if survey found in database.
      this.loadSurveyFromDB(userID);
      // In the meantime, create a new survey.
      this.activeSurvey = new Survey(userID, new Date(new Date().toDateString()), 'open');
    } else {
      // The following logic is to determine the survey needs to be refreshed because it's a new day.
      let today = new Date(new Date().toDateString());
      if (this.activeSurvey.date.toDateString() != today.toDateString()){
        this.activeSurvey = new Survey(userID, new Date(new Date().toDateString()), 'open');
      }
    }
    return this.activeSurvey;
  }

  public cleanUp(): void {
    this.activeSurvey = null;
  }

  public saveSurvey(survey: Survey): void {
    this.afs.collection('survey').add(survey.convertToDBObject());
  }

  public getClientSurveys(trainerID: string, date: Date): Observable<Survey[]> {
    // Request data from db.
    let surveyCol: AngularFirestoreCollection<Survey>;
    let surveys: Observable<Survey[]>;
    surveyCol = this.afs.collection('survey', ref => ref.where('trainerID', '==', trainerID).where('date', '==', date));
    surveys = surveyCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Survey;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return surveys;
  }

  public getSurveys(userID: string, startRange: Date, endRange: Date): Observable<Survey[]> {
    // Request data from db.
    let surveyCol: AngularFirestoreCollection<Survey>;
    let surveys: Observable<Survey[]>;
    surveyCol = this.afs.collection('survey', ref => ref.where('userID', '==', userID).where('date', '>=', startRange).where('date', '<', endRange).orderBy('date', 'asc'));
    surveys = surveyCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Survey;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return surveys;
  }

  private loadSurveyFromDB(userID: string): void {
    let surveyCol: AngularFirestoreCollection<Survey>;
    let surveys: Observable<Survey[]>;
    let today: Date = new Date(new Date().toDateString());
    // Send query request to database
    surveyCol = this.afs.collection('survey', ref => ref.where('date', '==', today).where('userID', '==', userID));
    surveys = surveyCol.valueChanges();
    // Listen for response
    surveys.forEach((ary: Survey[]) => {
      if (ary.length == 1) {
        this.activeSurvey = ary[0] as Survey;
        this.convertFirestoreTimestampsToDates(this.activeSurvey);
        // Fire notification
        this.activeSurveyUpdated.emit(this.activeSurvey);
      }
    });
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
