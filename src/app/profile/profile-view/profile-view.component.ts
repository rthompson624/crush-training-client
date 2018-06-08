import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../user/user.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { UserService } from '../../user/user.service';
import { Schedule } from '../../user/schedule.model';
import { ScheduleService } from '../../user/schedule.service';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { Observable, PartialObserver } from '@firebase/util';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AccordionModule } from 'primeng/accordion';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css']
})

export class ProfileViewComponent implements OnInit, OnDestroy {
  public user: User;
  public subjectUser: User;
  public isActive: boolean;
  public trainerView: boolean = false;
  public intakeSubscription: Subscription;
  public hasCompletedIntake: boolean = false;
  public intakeCoachNotes: string;
  public uploadProgress;
  public profilePicUrl;
  public displayProgress: boolean = false;
  public scheduleSubscription: Subscription;
  public schedule: Schedule[] = [];
  public DAYS_OF_WEEK: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  public scheduleOptions: SelectItem[];
  public hourOptions: SelectItem[] = [];
  public minuteOptions: SelectItem[] = [];
  public dayOptions: SelectItem[] = [];
  
  constructor(
    private router: Router, 
    private userService: UserService, 
    private scheduleService: ScheduleService, 
    private afStorage: AngularFireStorage
  ) {
    this.scheduleOptions = [
      {label: '', value: null}, 
      {label: 'In Person', value: 'inperson'}, 
      {label: 'Remote', value: 'remote'}
    ];
    this.hourOptions.push({label: '12 AM', value: '0'});
    for (let i = 1; i < 12; i++) {
      this.hourOptions.push({label: '' + i + ' AM', value: '' + i});
    }
    this.hourOptions.push({label: 'Noon', value: '12'});
    for (let i = 13; i < 24; i++) {
      this.hourOptions.push({label: '' + (i - 12) + ' PM', value: '' + i});
    }
    for (let i = 0; i < 60; i = i + 5) {
      if (i < 10) {
        this.minuteOptions.push({label: ':0' + i, value: '' + i});
      } else {
        this.minuteOptions.push({label: ':' + i, value: '' + i});
      }
    }
    for (let i = 0; i < this.DAYS_OF_WEEK.length; i++) {
      this.dayOptions.push({label: this.DAYS_OF_WEEK[i], value: i});
    }
  }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.getUserDependentData();
    }
  }

  ngOnDestroy() {
    if (this.intakeSubscription) this.intakeSubscription.unsubscribe();
    if (this.scheduleSubscription) this.scheduleSubscription.unsubscribe();
  }

  public getUserDependentData(): void {
    if (this.user.type == 'trainer') {
      this.subjectUser = this.userService.getActiveClient();
      this.trainerView = true;
    } else {
      this.subjectUser = this.user;
      this.trainerView = false;
    }
    if (this.subjectUser.status == 'active') {
      this.isActive = true;
    } else {
      this.isActive = false;
    }
    this.intakeSubscription = this.userService.getIntakeQuestionnaire(this.subjectUser.id).subscribe(
      (intakes: any[]) => {
        if (intakes.length > 0) {
          this.intakeCoachNotes = intakes[0].coachNotes;
          this.hasCompletedIntake = true;
        }
      }
    );
    if (this.subjectUser.hasProfilePic) {
      this.profilePicUrl = this.afStorage.ref('user/profile/' + this.subjectUser.id + '.jpg').getDownloadURL();
    }
    this.scheduleSubscription = this.scheduleService.getSchedule(this.subjectUser.id).subscribe(schedule  => this.schedule = schedule);
  }

  public onChangeStatus(): void {
    if (this.isActive) {
      this.subjectUser.status = 'active';
    } else {
      this.subjectUser.status = 'inactive';
    }
    this.userService.updateUserStatus(this.subjectUser);
  }

  public onScheduleOptionChange(day: Schedule): void {
    if (day.meetingType != 'inperson') {
      day.hour = 0;
      day.minute = 0;
    }
  }

  public onSaveScheduleClick(): void {
    this.scheduleService.updateSchedule(this.schedule);
  }

  public onBodyCompChange(): void {
    // Update user profile
    this.userService.updateUser(this.subjectUser);
  }

  public uploadFile(event): void {
    this.displayProgress = true;
    let uploadTask: AngularFireUploadTask = this.afStorage.ref('user/profile/' + this.subjectUser.id + '.jpg').put(event.target.files[0]);
    this.uploadProgress = uploadTask.percentageChanges();
    this.profilePicUrl = uploadTask.downloadURL();
    uploadTask.then().then(a => {
      this.displayProgress = false;
      this.subjectUser.hasProfilePic = true;
      this.userService.updateUser(this.subjectUser);
    });
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

  public uploadStatus(percentComplete: number): string {
    return 'Uploading... ' + Math.round(percentComplete) + '%';
  }

}
