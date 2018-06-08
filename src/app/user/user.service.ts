import { Injectable, EventEmitter, Output } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { User } from './user.model';
import { AuthService } from '../auth/auth.service';
import { DocumentReference } from '@firebase/firestore-types';
import { Subscription } from 'rxjs/Subscription';
import { Organization } from './organization.model';

@Injectable()
export class UserService {
  private activeUser: User;
  private activeUserRefreshDate: Date;
  private activeClient: User;
  @Output() activeUserUpdated: EventEmitter<User> = new EventEmitter<User>();

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public getActiveUser(): User {
    const now = new Date();
    if (now > this.activeUserRefreshDate) {
      this.reloadActiveUser();
    }
    return this.activeUser;
  }

  public loadAuthenticatedUser(authenticationUID: string): void {
    // An activeUserUpdated event will fire when the user is loaded
    this.loadUserFromDB(authenticationUID);
  }

  public cleanUp(): void {
    this.activeUser = null;
    this.activeClient = null;
  }

  public reloadActiveUser(): void {
    let userDoc: AngularFirestoreDocument<User>;
    let userObs: Observable<User>;
    userDoc = this.afs.doc('user/' + this.activeUser.id);
    userObs = userDoc.valueChanges();
    let sub = userObs.subscribe(user => {
      user.id = this.activeUser.id;
      this.convertFirestoreTimestampsToDates(user);
      this.activeUser = user;
      this.activeUserRefreshDate = this.addDays(1, new Date());
      sub.unsubscribe();
    });
  }

  private loadUserFromDB(authenticationUID: string): void {
    // Request data from db
    let userCol: AngularFirestoreCollection<User>;
    let users: Observable<User[]>;
    userCol = this.afs.collection('user', ref => ref.where('authenticationUID', '==', authenticationUID));
    users = userCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as User;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    // Listen for response
    let sub = users.subscribe(
      (user: User[]) => {
        if (user.length > 0) {
          this.activeUser = user[0] as User;
          this.activeUserRefreshDate = this.addDays(1, new Date());
          if (this.activeUser.type == 'trainer') {
            this.initializeTrainerMovementLibrary(this.activeUser.id);
            this.loadOrganizationSubscription();
          } else {
            this.activeUserUpdated.emit(this.activeUser);
          }
        }
        sub.unsubscribe();
      }
    );
  }

  private initializeTrainerMovementLibrary(trainerID: string): void {
    let seedDoc: AngularFirestoreDocument<any>;
    seedDoc = this.afs.doc('movementTrainer/' + trainerID + '/movement/seed-id');
    let sub = seedDoc.valueChanges().subscribe(doc => {
      if (!doc) {
        // Need to create seed record
        this.afs.doc('movementTrainer/' + trainerID).set({'trainerID': trainerID})
        .then(response => {
          this.afs.doc('movementTrainer/' + trainerID + '/movement/seed-id').set({'seed-field': 'seed-value'})
          .then(() => {
            sub.unsubscribe();
          });
        });
      } else {
        sub.unsubscribe();
      }
    });
  }

  private loadOrganizationSubscription(): void {
    // Get organization
    let organizationDoc: AngularFirestoreDocument<Organization>;
    organizationDoc = this.afs.doc('organization/' + this.activeUser.organizationID);
    let sub = organizationDoc.valueChanges().subscribe(org => {
      this.convertFirestoreTimestampsToDates(org);
      if (org.plan) {
        this.activeUser.plan = org.plan;
        this.activeUser.planExpiration = org.planExpiration;
      }
      this.activeUserUpdated.emit(this.activeUser);
    })
    
  }

  public setActiveClient(client: User): void {
    this.activeClient = client;
  }

  public getActiveClient(): User {
    return this.activeClient;
  }

  public getClients(trainerID: string): Observable<User[]> {
    let clientCol: AngularFirestoreCollection<User>;
    let clients: Observable<User[]>;
    clientCol = this.afs.collection('user', ref => ref.where('trainerID', '==', trainerID).orderBy('nameFirst', 'asc'));
    clients = clientCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as User;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return clients;
  }

  public getUser(userID: string): Observable<User[]> {
    let userCol: AngularFirestoreCollection<User>;
    let users: Observable<User[]>;
    userCol = this.afs.collection('user', ref => ref.where('id', '==', userID));
    users = userCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as User;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return users;
  }

  public createNewClient(authenticationUID: string, email: string, nameFirst: string, nameLast: string, trainerID: string): Promise<DocumentReference> {
    let today = new Date();
    today = new Date(today.toDateString());
    return this.afs.collection('user').add({
      authenticationUID: authenticationUID, 
      email: email, 
      nameFirst: nameFirst, 
      nameLast: nameLast, 
      hasProfilePic: false, 
      trainerID: trainerID, 
      type: 'client', 
      status: 'active', 
      dateCreated: today, 
      oneRepMaxMovementID: '', 
      bodyCompImplemented: true, 
      bodyCompMeasurementDayOfWeek: 2
    });
  }

  public createNewTrainer(authenticationUID: string, email: string, nameFirst: string, nameLast: string, organizationID: string): Promise<DocumentReference> {
    let today = new Date();
    today = new Date(today.toDateString());
    return this.afs.collection('user').add({
      authenticationUID: authenticationUID, 
      email: email, 
      nameFirst: nameFirst, 
      nameLast: nameLast, 
      hasProfilePic: false, 
      trainerID: '', 
      type: 'trainer', 
      status: 'active', 
      dateCreated: today, 
      organizationID: organizationID, 
      plan: 'Pro', 
      planExpiration: this.addDays(30, today), 
      stripeCustomerID: null
    });
  }

  public updateUser(user: User): void {
    if (!user.state) user.state = null;
    let userCol: AngularFirestoreCollection<User>;
    userCol = this.afs.collection<User>('user');
    userCol.doc(user.id).update({
      email: user.email, 
      type: user.type, 
      nameFirst: user.nameFirst, 
      nameLast: user.nameLast, 
      trainerID: user.trainerID, 
      city: user.city, 
      state: user.state, 
      country: user.country, 
      phone: user.phone, 
      birthday: user.birthday, 
      gender: user.gender, 
      height: user.height, 
      initialWeight: user.initialWeight, 
      weight: user.weight, 
      outcome: user.outcome, 
      outcomeReason: user.outcomeReason, 
      hasProfilePic: user.hasProfilePic, 
      status: user.status, 
      dateCreated: user.dateCreated, 
      oneRepMaxMovementID: user.oneRepMaxMovementID, 
      bodyCompImplemented: user.bodyCompImplemented, 
      bodyCompMeasurementDayOfWeek: user.bodyCompMeasurementDayOfWeek
    });
  }

  public updateUserStatus(user: User): void {
    let userCol: AngularFirestoreCollection<User>;
    userCol = this.afs.collection<User>('user');
    userCol.doc(user.id).update({
      status: user.status
    });
  }

  public getIntakeQuestionnaire(userID: string): Observable<any[]> {
    // Request data from db.
    let intakeCol: AngularFirestoreCollection<any>;
    let intakes: Observable<any[]>;
    intakeCol = this.afs.collection('intake-questionnaire', ref => ref.where('userID', '==', userID));
    intakes = intakeCol.snapshotChanges().map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data();
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    );
    return intakes;
  }

  public getOrganization(organizationID: string): Observable<any> {
    let orgDoc: AngularFirestoreDocument<any>;
    let orgObs: Observable<any>;
    orgDoc = this.afs.doc('organization/' + organizationID);
    orgObs = orgDoc.valueChanges();
    return orgObs;
  }

  private addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
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
