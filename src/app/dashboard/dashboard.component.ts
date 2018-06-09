import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStateService } from '../navigation/navigation-state.service';
import { Workout } from '../workout/workout.model';
import { Segment } from '../workout/segment.model';
import { Exercise } from '../workout/exercise.model';
import { WorkoutService } from '../workout/workout.service';
import { LifestyleService } from '../lifestyle/lifestyle.service';
import { Survey } from '../lifestyle/survey.model';
import { User } from '../user/user.model';
import { MessageService } from '../message/message.service';
import { BodyCompMeasurement } from '../progress/body-comp-measurement.model';
import { ProgressService } from '../progress/progress.service';
import { Router } from '@angular/router';
import { Subscription ,  Observable } from 'rxjs';
import { UserService } from '../user/user.service';
import { TipService } from '../tip/tip.service';
import { Tip } from '../tip/tip.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  public user: User;
  public dateToday: Date;
  public survey: Survey;
  public unreadMessageCount: number = 0;
  public workoutHeadersSubscription: Subscription;
  public workoutLoadedSubscription: Subscription;
  public workouts: Workout[] = [];
  public activeSurveySubscription: Subscription;
  public unreadMessageCountSubscription: Subscription;
  public tipOfTheDay: Tip;
  public tipSub: Subscription;
  public intakeSubscription: Subscription;
  public hasCompletedIntake: boolean = false;
  public workoutsYesterday: Observable<Workout[]>;
  public surveyYesterdaySubscription: Subscription;
  public surveyCompletedYesterday: boolean = false;
  public bodyCompNotification: boolean = false;
  public bodyCompSubscription: Subscription;

  constructor(
    private router: Router, 
    private workoutService: WorkoutService, 
    private navigationStateService: NavigationStateService, 
    private lifestyleService: LifestyleService, 
    private messageService: MessageService, 
    private userService: UserService, 
    private tipService: TipService, 
    private progressService: ProgressService
  ) { }

  ngOnInit() {
    this.dateToday = new Date();
    this.dateToday = new Date(this.dateToday.toDateString());
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.loadUserDependentResources();
    }
  }

  ngOnDestroy() {
    if (this.activeSurveySubscription) this.activeSurveySubscription.unsubscribe();
    if (this.unreadMessageCountSubscription) this.unreadMessageCountSubscription.unsubscribe();
    if (this.tipSub) this.tipSub.unsubscribe();
    if (this.intakeSubscription) this.intakeSubscription.unsubscribe();
    if (this.surveyYesterdaySubscription) this.surveyYesterdaySubscription.unsubscribe();
    if (this.workoutHeadersSubscription) this.workoutHeadersSubscription.unsubscribe();
    if (this.workoutLoadedSubscription) this.workoutLoadedSubscription.unsubscribe();
    if (this.bodyCompSubscription) this.bodyCompSubscription.unsubscribe();
  }

  public onSelectTraining(): void {
    this.navigationStateService.calendarView = 'single-client';
    this.router.navigate(['/', 'calendar']);
  }

  public onSelectWorkout(workout: Workout): void {
    this.router.navigate(['/', 'workouts', workout.id]);
  }

  public loadUserDependentResources(): void {
    this.workoutLoadedSubscription = this.workoutService.workoutLoaded.subscribe(
      (workout: Workout) => {
        let isDuplicate = false;
        for (let i = 0; i < this.workouts.length; i++) {
          if (this.workouts[i].id == workout.id) isDuplicate = true;
        }
        if (!isDuplicate) this.workouts.push(workout);
        this.workouts.sort((a: Workout, b: Workout) => this.workoutSortOrder(a, b));
      }
    );
    this.loadWorkoutHeaders();
    // this.loadWorkoutHeaders();
    this.survey = this.lifestyleService.getActiveSurvey(this.user.id);
    this.activeSurveySubscription = this.lifestyleService.activeSurveyUpdated.subscribe(
      (survey: Survey) => {
        this.survey = survey;
      }
    );
    this.messageService.unreadMessageCount(this.user.id, this.user.id);
    this.unreadMessageCountSubscription = this.messageService.unreadMessageCountEvent.subscribe(
      (unread: number) => {
        this.unreadMessageCount = unread;
      }
    );
    this.tipSub = this.tipService.getTipForToday(this.user.trainerID).subscribe(
      (tips: Tip[]) => {
        if (tips.length > 0) this.tipOfTheDay = tips[0];
      }
    );
    this.intakeSubscription = this.userService.getIntakeQuestionnaire(this.user.id).subscribe(
      (intakes: any[]) => {
        if (intakes.length > 0) {
          this.hasCompletedIntake = true;
        }
      }
    );
    this.workoutsYesterday = this.workoutService.getWorkoutHeaders(this.user.id, this.addDays(-1, this.dateToday), this.dateToday);
    this.surveyYesterdaySubscription = this.lifestyleService.getSurveys(this.user.id, this.addDays(-1, this.dateToday), this.dateToday).subscribe(
      (surveys: Survey[]) => {
        if (surveys.length > 0) this.surveyCompletedYesterday = true;
      }
    );
    if (this.user.bodyCompImplemented && this.bodyCompDueWithinPastThreeDays()) {
      this.bodyCompSubscription = this.progressService.getBodyCompMeasurements(this.user.id, this.addDays(-2, this.dateToday), this.dateToday).subscribe((measurements: BodyCompMeasurement[]) => {
        if (measurements.length == 0) {
          this.bodyCompNotification = true;
        }
      });
    }
  }

  public bodyCompDueWithinPastThreeDays(): boolean {
    let isDue = false;
    if (this.jsDayOfWeek(this.user.bodyCompMeasurementDayOfWeek) == this.dateToday.getDay()) isDue = true;
    if (this.jsDayOfWeek(this.user.bodyCompMeasurementDayOfWeek) == this.addDays(-1, this.dateToday).getDay()) isDue = true;
    if (this.jsDayOfWeek(this.user.bodyCompMeasurementDayOfWeek) == this.addDays(-2, this.dateToday).getDay()) isDue = true;
    return isDue;
  }

  public loadWorkoutHeaders(): void {
    this.workoutHeadersSubscription = this.workoutService.getWorkoutHeaders(this.user.id, this.dateToday, this.addDays(1, this.dateToday)).subscribe(
      (workoutHeaders: Workout[]) => {
        this.loadWorkouts(workoutHeaders);
        this.workoutHeadersSubscription.unsubscribe();
      }
    );
  }

  public loadWorkouts(workoutHeaders: Workout[]): void {
    this.workouts.splice(0, this.workouts.length); // clear array
    for (let i = 0; i < workoutHeaders.length; i++) {
      this.workoutService.getWorkoutByID(workoutHeaders[i].id);
    }
  }

  public uncompletedWorkouts(): number {
    let count = 0;
    for (let i = 0; i < this.workouts.length; i++) {
      if (this.workouts[i].status == 'open') count++;
    }
    return count;
  }

  public workoutSortOrder(a: Workout, b: Workout): number {
    let retVal: number = 0;
    let compareDateA = new Date(a.assignmentDate);
    let compareDateB = new Date(b.assignmentDate);
    if (a.meetingType == 'remote') compareDateA.setHours(23, 59);
    if (b.meetingType == 'remote') compareDateB.setHours(23, 59);
    if (compareDateB > compareDateA) retVal = -1;
    if (compareDateB < compareDateA) retVal = 1;
    if (compareDateB.getTime() == compareDateA.getTime()) {
      if (b.userName >= a.userName) {
        retVal = -1;
      } else {
        retVal = 1;
      }
    }
    return retVal;
  }

  public addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
  }

  public formatDate(date: Date): string {
    const options = {weekday:'long', month:'long', day:'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

  public formatTime(date: Date): string {
    let am_pm = 'AM';
    let hour = date.getHours();
    if (hour >= 12) am_pm = 'PM';
    if (hour > 12) hour = hour - 12;
    let minuteString = date.getMinutes().toString();
    if (date.getMinutes() < 10) minuteString = '0' + date.getMinutes().toString();
    return hour.toString() + ':' + minuteString + ' ' + am_pm;
  }

  public formatMultiline(value: string): string {
    return value.replace(/[\n\r]/g, '<br>');
  }

  public jsDayOfWeek(systemDayOfWeek: number): number {
    let jsDayOfWeek = systemDayOfWeek + 1;
    if (jsDayOfWeek == 7) jsDayOfWeek = 0;
    return jsDayOfWeek;
  }

  public sysDayOfWeek(jsDayOfWeek: number): number {
    let sysDayOfWeek = jsDayOfWeek - 1;
    if (sysDayOfWeek == -1) sysDayOfWeek = 6;
    return sysDayOfWeek;
  }

}
