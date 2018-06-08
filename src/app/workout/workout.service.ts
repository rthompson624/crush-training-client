import { Injectable, EventEmitter, Output } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Workout } from './workout.model';
import { Segment } from './segment.model';
import { Exercise } from './exercise.model';
import { Movement } from './movement.model';
import { UserMovementHistory } from './user-movement-history.model';
import { last } from '@angular/router/src/utils/collection';

@Injectable()
export class WorkoutService {
  @Output() workoutLoaded: EventEmitter<Workout> = new EventEmitter<Workout>();

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public cleanUp(): void {
  }

  public getWorkout(userID: string, date: Date): Workout {
    let loadingWorkout: Workout;
    let dateOnly = new Date(date.toDateString());
    this.loadWorkoutFromDB(userID, dateOnly, loadingWorkout);
    return loadingWorkout;
  }

  public getWorkoutByID(workoutID: string): Workout {
    let loadingWorkout: Workout;
    this.loadWorkoutFromDBbyID(workoutID, loadingWorkout);
    return loadingWorkout;
  }

  public updateWorkout(workout: Workout): void {
    if (workout.id) {
      // Workout already exists in the database
      this.deleteWorkout(workout.id);
    }
    // Generate new id for workout
    // workout.id = workout.userID.slice(0, 12) + this.generateUniqueID();
    workout.id = this.createUUID();
    this.createWorkout(workout);
  }

  public deleteWorkout(workoutID: string): void {
    // Request workout data from db
    let workoutDoc: AngularFirestoreDocument<Workout>;
    let workoutObs: Observable<Workout>;
    let workoutToDelete: Workout;
    workoutDoc = this.afs.doc('workout/' + workoutID);
    workoutObs = workoutDoc.valueChanges();
    // Listen for response
    let sub = workoutObs.subscribe(
      (workout: Workout) => {
        if (workout) {
          workoutToDelete = workout;
          workoutToDelete.id = workoutID;
          // Request segment data from db
          let segmentCol: AngularFirestoreCollection<Segment>;
          let segments: Observable<Segment[]>;
          segmentCol = this.afs.collection('workout/' + workoutID + '/segment', ref => ref.orderBy('order', 'asc'));
          segments = segmentCol.snapshotChanges().map(
            changeCol => {
              return changeCol.map(
                change => {
                  let data = change.payload.doc.data() as Segment;
                  data.id = change.payload.doc.id;
                  return data;
                }
              );
            }
          );
          // Listen for response
          let sub = segments.subscribe(
            (segment: Segment[]) => {
              if (segment.length > 0) {
                const lastIndex = this.lastSegmentWithExercise(segment);
                workoutToDelete.segments = segment.slice();
                if (lastIndex > -1) {
                  // Request exercise data from db
                  let exerciseCol: AngularFirestoreCollection<Exercise>;
                  let exercises: Observable<Exercise[]>;
                  for (let i = 0; i < workoutToDelete.segments.length; i++) {
                    exerciseCol = this.afs.collection('workout/' + workoutID + '/segment/' + workoutToDelete.segments[i].id + '/exercise', ref => ref.orderBy('order', 'asc'));
                    exercises = exerciseCol.snapshotChanges().map(
                      changeCol => {
                        return changeCol.map(
                          change => {
                            let data = change.payload.doc.data() as Exercise;
                            data.id = change.payload.doc.id;
                            return data;
                          }
                        );
                      }
                    );
                    // Listen for response
                    let sub = exercises.subscribe(
                      (exercise: Exercise[]) => {
                        if (exercise.length > 0) {
                          workoutToDelete.segments[i].exercises = exercise.slice();
                          if (i == lastIndex) {
                            // Woohoo we're done... Time to delete
                            for (let m = 0; m < workoutToDelete.segments.length; m++) {
                              if (workoutToDelete.segments[m].exercises) {
                                for (let n = 0; n < workoutToDelete.segments[m].exercises.length; n++) {
                                  // Delete exercises
                                  this.afs.doc('workout/' + workoutToDelete.id + '/segment/' + workoutToDelete.segments[m].id + '/exercise/' + workoutToDelete.segments[m].exercises[n].id).delete();
                                }
                              }
                              // Delete segments
                              this.afs.doc('workout/' + workoutToDelete.id + '/segment/' + workoutToDelete.segments[m].id).delete();
                            }
                            // Delete workout
                            if (workoutToDelete.status == 'complete') this.deleteUserMovementHistory(workoutToDelete);
                            this.afs.doc('workout/' + workoutToDelete.id).delete();
                          }
                        }
                        sub.unsubscribe();
                      }
                    );
                  }
                } else {
                  // Case when workout contains only one segment that has no exercises
                  for (let m = 0; m < workoutToDelete.segments.length; m++) {
                    // Delete segments
                    this.afs.doc('workout/' + workoutToDelete.id + '/segment/' + workoutToDelete.segments[m].id).delete();
                  }
                  // Delete workout
                  if (workoutToDelete.status == 'complete') this.deleteUserMovementHistory(workoutToDelete);
                  this.afs.doc('workout/' + workoutToDelete.id).delete();
                }
              }
              sub.unsubscribe();
            }
          );
        } else {
          console.log('WorkoutService::deleteWorkout() No workout record with ID ' + workoutID + ' exists in database.');
        }
        sub.unsubscribe();
      }
    );
    
  }

  private createWorkout(workout: Workout): void {
    // Generate id's for segments and exercises
    for (let i = 0; i < workout.segments.length; i++) {
      workout.segments[i].id = 'segment-id-' + i;
      if (workout.segments[i].exercises) {
        for (let j = 0; j < workout.segments[i].exercises.length; j++) {
          workout.segments[i].exercises[j].id = 'exercise-id-' + j;
        }
      }
    }
    // Create workout doc
    this.afs.collection('workout').doc(workout.id).set({
      assignmentDate: workout.assignmentDate, 
      status: workout.status, 
      submittedDate: workout.submittedDate, 
      userID: workout.userID, 
      meetingType: workout.meetingType, 
      trainerID: workout.trainerID, 
      userName: workout.userName
    });
    for (let i = 0; i < workout.segments.length; i++) {
      // Create segment docs
      this.afs.doc('workout/' + workout.id + '/segment/' + workout.segments[i].id).set({
        order: workout.segments[i].order, 
        type: workout.segments[i].type, 
        circuitName: workout.segments[i].circuitName, 
        circuitDescription: workout.segments[i].circuitDescription, 
        circuitResult: workout.segments[i].circuitResult
      });
      if (workout.segments[i].exercises) {
        for (let j = 0; j < workout.segments[i].exercises.length; j++) {
            // Create exercise docs
          this.afs.doc('workout/' + workout.id + '/segment/' + workout.segments[i].id + '/exercise/' + workout.segments[i].exercises[j].id).set({
            order: Number(workout.segments[i].exercises[j].order), 
            movementID: workout.segments[i].exercises[j].movementID, 
            movement: workout.segments[i].exercises[j].movement, 
            sets: Number(workout.segments[i].exercises[j].sets), 
            reps: Number(workout.segments[i].exercises[j].reps), 
            weight: Number(workout.segments[i].exercises[j].weight), 
            repsLastSet: Number(workout.segments[i].exercises[j].repsLastSet)
          });
        }
      }
    }
  }

  private lastSegmentWithExercise(segments: Segment[]): number {
    let last = -1;
    for (let i = 0; i < segments.length; i++) {
      if ((segments[i].type == 'singleset') || (segments[i].type == 'superset')) last = i;
    }
    return last;
  }

  private loadWorkoutFromDB(userID: string, date: Date, loadingWorkout: Workout): void {
    // Request data from db
    let workoutCol: AngularFirestoreCollection<Workout>;
    let workouts: Observable<Workout[]>;
    let nextDay = new Date(date.getTime() + 86400000);
    workoutCol = this.afs.collection('workout', ref => ref.where('assignmentDate', '>=', date).where('assignmentDate', '<', nextDay).where('userID', '==', userID));
    workouts = workoutCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Workout;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    // Listen for response
    let sub = workouts.subscribe(
      (workout: Workout[]) => {
        if (workout.length > 0) {
          loadingWorkout = workout[0] as Workout;
          this.loadSegmentsFromDB(loadingWorkout);
        }
        sub.unsubscribe();
      }
    );
  }

  private loadWorkoutFromDBbyID(workoutID: string, loadingWorkout: Workout): void {
    // Request data from db
    let workoutDoc: AngularFirestoreDocument<Workout>;
    let workoutObs: Observable<Workout>;
    workoutDoc = this.afs.doc('workout/' + workoutID);
    workoutObs = workoutDoc.valueChanges();
    // Listen for response
    let sub = workoutObs.subscribe(
      (workout: Workout) => {
        if (workout) {
          loadingWorkout = workout;
          loadingWorkout.id = workoutID;
          this.convertFirestoreTimestampsToDates(loadingWorkout);
          this.loadSegmentsFromDB(loadingWorkout);
        }
        sub.unsubscribe();
      }
    );
  }

  private loadSegmentsFromDB(loadingWorkout: Workout): void {
    // Request data from db
    let segmentCol: AngularFirestoreCollection<Segment>;
    let segments: Observable<Segment[]>;
    segmentCol = this.afs.collection('workout/' + loadingWorkout.id + '/segment', ref => ref.orderBy('order', 'asc'));
    segments = segmentCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Segment;
            data.id = change.payload.doc.id;
            return data;
          }
        );
      }
    );
    // Listen for response
    let sub = segments.subscribe(
      (segment: Segment[]) => {
        if (segment.length > 0) {
          loadingWorkout.segments = segment.slice();
          this.loadExercisesFromDB(loadingWorkout);
        }
        sub.unsubscribe();
      }
    );
  }

  private loadExercisesFromDB(loadingWorkout: Workout): void {
    // Request data from db
    let exerciseCol: AngularFirestoreCollection<Exercise>;
    let exercises: Observable<Exercise[]>;
    const lastIndex = this.lastSegmentWithExercise(loadingWorkout.segments);
    if (lastIndex > -1) {
      for (let i = 0; i < loadingWorkout.segments.length; i++) {
        exerciseCol = this.afs.collection('workout/' + loadingWorkout.id + '/segment/' + loadingWorkout.segments[i].id + '/exercise', ref => ref.orderBy('order', 'asc'));
        exercises = exerciseCol.snapshotChanges().map(
          changeCol => {
            return changeCol.map(
              change => {
                let data = change.payload.doc.data() as Exercise;
                data.id = change.payload.doc.id;
                return data;
              }
            );
          }
        );
        // Listen for response
        let sub = exercises.subscribe(
          (exercise: Exercise[]) => {
            if (exercise.length > 0) {
              loadingWorkout.segments[i].exercises = exercise.slice();
              if (i == lastIndex) this.workoutLoaded.emit(loadingWorkout);
            }
            sub.unsubscribe();
          }
        );
      }
    } else {
      this.convertFirestoreTimestampsToDates(loadingWorkout);
      this.workoutLoaded.emit(loadingWorkout);
    }
  }

  public getStandardMovements(): Observable<Movement[]> {
    let movementCol: AngularFirestoreCollection<Movement>;
    let movements: Observable<Movement[]>;
    movementCol = this.afs.collection('movement', ref => ref.orderBy('name', 'asc'));
    movements = movementCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Movement;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return movements;
  }

  public getTrainerMovements(trainerID: string): Observable<Movement[]> {
    let movementCol: AngularFirestoreCollection<Movement>;
    let movements: Observable<Movement[]>;
    movementCol = this.afs.collection('movementTrainer/' + trainerID + '/movement', ref => ref.orderBy('name', 'asc'));
    movements = movementCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Movement;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return movements;
  }

  public addMovement(movement: Movement, trainerID: string): void {
    this.afs.collection('movementTrainer/' + trainerID + '/movement').add(movement.convertToDBObject());
  }

  public updateMovement(movement: Movement, trainerID: string): void {
    this.afs.collection('movementTrainer/' + trainerID + '/movement').doc(movement.id).update({
      name: movement.name, 
      youtubeID: movement.youtubeID, 
      source: movement.source
    });
  }

  public deleteMovement(movement: Movement, trainerID: string): void {
    this.afs.doc('movementTrainer/' + trainerID + '/movement/' + movement.id).delete();
  }

  public getUserMovementHistory(userID: string, movementID: string): Observable<UserMovementHistory[]> {
    let movementCol: AngularFirestoreCollection<UserMovementHistory>;
    let movements: Observable<UserMovementHistory[]>;
    movementCol = this.afs.collection('userMovementHistory', ref => ref.where('userID', '==', userID).where('movementID', '==', movementID).orderBy('date', 'desc'));
    movements = movementCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as UserMovementHistory;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return movements;
  }

  public getUserMovementHistoryForPeriod(userID: string, movementID: string, startRange: Date, endRange: Date): Observable<UserMovementHistory[]> {
    let movementCol: AngularFirestoreCollection<UserMovementHistory>;
    let movements: Observable<UserMovementHistory[]>;
    movementCol = this.afs.collection('userMovementHistory', ref => ref.where('userID', '==', userID).where('movementID', '==', movementID).where('date', '>=', startRange).where('date', '<=', endRange).orderBy('date', 'desc'));
    movements = movementCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as UserMovementHistory;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return movements;
  }

  public addUserMovementHistory(workout: Workout): void {
    let userMovements: UserMovementHistory[] = [];
    for (let i = 0; i < workout.segments.length; i++) {
      if (workout.segments[i].exercises) {
        for (let j = 0; j < workout.segments[i].exercises.length; j++) {
          userMovements.push(new UserMovementHistory(
            null, 
            workout.userID, 
            workout.assignmentDate, 
            workout.segments[i].exercises[j].movement, 
            workout.segments[i].exercises[j].movementID, 
            workout.segments[i].exercises[j].reps, 
            workout.segments[i].exercises[j].sets, 
            Number(workout.segments[i].exercises[j].weight), 
            Number(workout.segments[i].exercises[j].repsLastSet)
          ));
        }
      }
    }
    for (let k = 0; k < userMovements.length; k++) {
      this.afs.collection('userMovementHistory').add(userMovements[k].convertToDBObject());
    }
  }

  private deleteUserMovementHistory(workout: Workout): void {
    // Request data from db
    let movementCol: AngularFirestoreCollection<UserMovementHistory>;
    let movementObs: Observable<UserMovementHistory[]>;
    movementCol = this.afs.collection('userMovementHistory', ref => ref.where('userID', '==', workout.userID).where('date', '==', workout.submittedDate));
    movementObs = movementCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as UserMovementHistory;
            data.id = change.payload.doc.id;
            return data;
          }
        );
      }
    );
    // Listen for response
    let sub = movementObs.subscribe(
      (movements: UserMovementHistory[]) => {
        for (let i = 0; i < movements.length; i++) {
          this.afs.doc('userMovementHistory/' + movements[i].id).delete();
        }
        sub.unsubscribe();
      }
    );
  }

  public getClientWorkoutHeaders(trainerID: string, startRange: Date, endRange: Date): Observable<Workout[]> {
    let workoutCol: AngularFirestoreCollection<Workout>;
    let workouts: Observable<Workout[]>;
    workoutCol = this.afs.collection('workout', ref => ref.where('trainerID', '==', trainerID).where('assignmentDate', '>=', startRange).where('assignmentDate', '<', endRange).orderBy('assignmentDate', 'asc').orderBy('userName', 'asc'));
    workouts = workoutCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Workout;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return workouts;
  }

  public getWorkoutHeaders(userID: string, startRange: Date, endRange: Date): Observable<Workout[]> {
    let workoutCol: AngularFirestoreCollection<Workout>;
    let workouts: Observable<Workout[]>;
    workoutCol = this.afs.collection('workout', ref => ref.where('userID', '==', userID).where('assignmentDate', '>=', startRange).where('assignmentDate', '<', endRange).orderBy('assignmentDate', 'asc'));
    workouts = workoutCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as Workout;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return workouts;
  }

  public calculateOneRepMax(userMovement: UserMovementHistory): number {
    let oneRepMaxTable: number[] = [100, 97, 94, 92, 89, 86, 83, 81, 78, 75, 73, 71, 70, 68, 67, 65, 64, 63, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50];
    let oneRepMaxCalculation: number;
    if (userMovement.reps > 30) {
      oneRepMaxCalculation = userMovement.weight / (50 / 100);
    } else {
      oneRepMaxCalculation = userMovement.weight / (oneRepMaxTable[userMovement.reps - 1] / 100);
    }
    return oneRepMaxCalculation;
  }

  private createUUID(): string {
    // I modified two lines of code so that the function returns a 20-character id without dashes
    
    // http://www.ietf.org/rfc/rfc4122.txt
    let s = [];
    let hexDigits = '0123456789abcdef';
    // for (let i = 0; i < 36; i++) {
    for (let i = 0; i < 20; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    // s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join('');
    return uuid;
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
