import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Schedule } from './schedule.model';

@Injectable()

export class ScheduleService {

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public getSchedule(userID: string): Observable<Schedule[]> {
    let scheduleCol: AngularFirestoreCollection<Schedule>;
    let schedule: Observable<Schedule[]>;
    scheduleCol = this.afs.collection('schedule', ref => ref.where('userID', '==', userID).orderBy('dayOfWeek', 'asc'));
    schedule = scheduleCol.snapshotChanges().map(
      changeCol => {
        if (changeCol.length == 0) {
          // First time. Need to create set of records
          let newSchedule: Schedule[] = [];
          for (let i = 0; i < 7; i++) {
            let newScheduleElement = new Schedule();
            newScheduleElement.dayOfWeek = i;
            newScheduleElement.userID = userID;
            newScheduleElement.displayTime = new Date();
            newScheduleElement.displayTime = new Date(newScheduleElement.displayTime.toDateString());
            newScheduleElement.hour = 0;
            newScheduleElement.minute = 0;
            newScheduleElement.meetingType = null;
            newSchedule.push(newScheduleElement);
          }
          return newSchedule;
        } else {
          return changeCol.map(
            change => {
              let data = change.payload.doc.data() as Schedule;
              data.id = change.payload.doc.id;
              data.displayTime = new Date();
              data.displayTime = new Date(data.displayTime.toDateString());
              data.displayTime.setHours(data.hour, data.minute);
              this.convertFirestoreTimestampsToDates(data);
              return data;
            }
          );
        }
      }
    );
    return schedule;
  }

  public updateSchedule(schedule: Schedule[]): void {
    if (schedule[0].id) {
      // Update
      for (let i = 0; i < schedule.length; i++) {
        this.afs.collection('schedule').doc(schedule[i].id).update({
          dayOfWeek: schedule[i].dayOfWeek, 
          hour: schedule[i].hour, 
          meetingType: schedule[i].meetingType, 
          minute: schedule[i].minute, 
          userID: schedule[i].userID
        });
      }
    } else {
      // Create
      for (let i = 0; i < schedule.length; i++) {
        this.afs.collection('schedule').add(schedule[i].convertToDBObject());
      }
    }
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
