import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.model';
import { BodyCompMeasurement } from '../body-comp-measurement.model';
import { ProgressService } from '../progress.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { KeyFilterModule } from 'primeng/keyfilter';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-body-composition-input',
  templateUrl: './body-composition-input.component.html',
  styleUrls: ['./body-composition-input.component.css']
})
export class BodyCompositionInputComponent implements OnInit, OnDestroy {
  public user: User;
  public subjectUser: User;
  public today: Date;
  public measurement: BodyCompMeasurement;
  public displayProgress: boolean = false;
  public uploadProgress: Observable<number>;
  public displayInvalidFormDialog: boolean = false;
  public formIssues: string[];

  constructor(
    private router: Router, 
    private userService: UserService, 
    private afStorage: AngularFireStorage, 
    private progressService: ProgressService
  ) { }

  ngOnInit() {
    this.today = new Date();
    this.today = new Date(this.today.toDateString());
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      if (this.user.type == 'trainer') {
        this.subjectUser = this.userService.getActiveClient();
      } else {
        this.subjectUser = this.userService.getActiveUser();
      }
      this.measurement = new BodyCompMeasurement;
      this.measurement.date = new Date(this.today.toDateString());
      this.measurement.userID = this.subjectUser.id;
    }
  }

  public uploadFile(event): void {
    this.displayProgress = true;
    let fileName = this.createUUID() + '.jpg';
    let uploadTask: AngularFireUploadTask = this.afStorage.ref('user/progress/' + this.subjectUser.id + '/' + fileName).put(event.target.files[0]);
    this.uploadProgress = uploadTask.percentageChanges();
    this.measurement.picUrl = uploadTask.downloadURL();
    uploadTask.then().then(a => {
      this.displayProgress = false;
      this.measurement.progressPic = fileName;
    });
  }

  public onClickSubmit(): void {
    if (this.isFormValid()) {
      this.progressService.createBodyCompMeasurement(this.measurement);
      if (this.user.type == 'trainer') {
        this.router.navigate(['/', 'dashboard-trainer']);
      } else {
        this.router.navigate(['/', 'dashboard']);
      }
    } else {
      this.displayInvalidFormDialog = true;
    }
  }

  public isFormValid(): boolean {
    let isValid = true;
    this.formIssues = [];
    if (!this.measurement.weight) {
      this.formIssues.push('Weight is missing.');
      isValid = false;
    }
    if (!this.measurement.abdominalFat) {
      this.formIssues.push('Body Fat is missing.');
      isValid = false;
    }
    if (!this.measurement.waistCircumference) {
      this.formIssues.push('Waist is missing.');
      isValid = false;
    }
    if (!this.measurement.progressPic) {
      this.formIssues.push('Photo is missing.');
      isValid = false;
    }
    return isValid;
  }

  public createUUID(): string {
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

  public uploadStatus(percentComplete: number): string {
    return 'Uploading... ' + Math.round(percentComplete) + '%';
  }

  ngOnDestroy() {

  }

}
