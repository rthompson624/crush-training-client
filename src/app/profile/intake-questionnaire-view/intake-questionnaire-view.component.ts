import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.model';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-intake-questionnaire-view',
  templateUrl: './intake-questionnaire-view.component.html',
  styleUrls: ['./intake-questionnaire-view.component.css']
})
export class IntakeQuestionnaireViewComponent implements OnInit {
  public user: User;
  public subjectUser: User;
  public intakes: Observable<any[]>;
  public intakeID: string;
  public coachNotes: string;

  constructor(private userService: UserService, private afs: AngularFirestore, private router: Router) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      if (this.user.type == 'trainer') {
        this.subjectUser = this.userService.getActiveClient();
      } else {
        this.subjectUser = this.user;
      }
      let intakeCol = this.afs.collection('intake-questionnaire', ref => ref.where('userID', '==', this.subjectUser.id));
      this.intakes = intakeCol.snapshotChanges().pipe(map(
        changeCol => {
          return changeCol.map(
            change => {
              let data = change.payload.doc.data();
              this.coachNotes = data['coachNotes'];
              this.intakeID = change.payload.doc.id;
              this.convertFirestoreTimestampsToDates(data);
              return data;
            }
          );
        }
      ));
    }
  }

  public onSaveClick(): void {
    let intakeCol = this.afs.collection('intake-questionnaire');
    intakeCol.doc(this.intakeID).update({coachNotes: this.coachNotes});
    this.router.navigate(['/', 'profile']);
  }

  public updateCoachNotes(event) {
    this.coachNotes = event.target.value;
  }

  public getAge(birthday: Date): number {
    if (!birthday) return null;
    let ageDifMs = Date.now() - birthday.getTime();
    let ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  public getFeetAndInches(inches: number): string {
    if (!inches) return null;
    let feetPortion: string = Math.floor(inches / 12).toString();
    let inchPortion: string = Number(inches % 12).toString();
    return feetPortion + '\'' + inchPortion + '\"';
  }

  public formatMultiline(value: string): string {
    if (!value) return null;
    return value.replace(/[\n\r]/g, '<br>');
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
