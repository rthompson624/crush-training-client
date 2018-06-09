import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStateService } from '../navigation/navigation-state.service';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { Schedule } from '../user/schedule.model';
import { ScheduleService } from '../user/schedule.service';
import { Workout } from '../workout/workout.model';
import { WorkoutService } from '../workout/workout.service';
import { Survey } from '../lifestyle/survey.model';
import { LifestyleService } from '../lifestyle/lifestyle.service';
import { Message } from '../message/message.model';
import { MessageService } from '../message/message.service';
import { ProgressService } from '../progress/progress.service';
import { BodyCompMeasurement } from '../progress/body-comp-measurement.model';
import { PaymentService } from '../payments/payment.service';
import { StripeSubscription} from '../payments/stripe-subscription.model';
import { Subscription ,  Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { DialogModule } from 'primeng/dialog';

const DAY_MSEC: number = 86400000;
const HOUR_MSEC: number = 3600000;

interface MissedAssignment {
  clientName: string;
  missedWorkout: boolean;
  missedSurvey: boolean;
  missedBodyComp: boolean;
}

@Component({
  selector: 'app-dashboard-trainer',
  templateUrl: './dashboard-trainer.component.html',
  styleUrls: ['./dashboard-trainer.component.css']
})
export class DashboardTrainerComponent implements OnInit, OnDestroy {
  public dateToday: Date;
  public user: User;
  public clients: User[];
  public clientsSubscription: Subscription;
  public activeUserSubscription: Subscription;
  public surveysSubscription: Subscription;
  public surveysYesterday: Survey[];
  public workoutsTodayObserv: Observable<Workout[]>;
  public workoutsTodaySubscription: Subscription;
  public workoutsToday: Workout[] = [];
  public workoutsYesterdaySubscription: Subscription;
  public workoutsYesterday: Workout[];
  public unreadMessages: Message[];
  public messagesSubscription: Subscription;
  public scheduleSubscription: Subscription;
  public schedule: Schedule[] = [];
  public bodyCompSubscription: Subscription;
  public bodyComps: BodyCompMeasurement[] = [];
  public bodyCompsLoaded: boolean = false;
  public trainerSubscription: StripeSubscription = null;
  public subscriptionSubscription: Subscription;
  public plans: any[] = environment.stripePlans;
  public displaySubscriptionExpiredDialog: boolean = false;
  public displayExceededClientLimitDialog: boolean = false;

  constructor(
    private router: Router, 
    private userService: UserService, 
    private lifestyleService: LifestyleService, 
    private workoutService: WorkoutService, 
    private messageService: MessageService, 
    private scheduleService: ScheduleService, 
    private navigationService: NavigationStateService, 
    private progressService: ProgressService, 
    private paymentService: PaymentService
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
    if (this.clientsSubscription) this.clientsSubscription.unsubscribe();
    if (this.surveysSubscription) this.surveysSubscription.unsubscribe();
    if (this.workoutsYesterdaySubscription) this.workoutsYesterdaySubscription.unsubscribe();
    if (this.workoutsTodaySubscription) this.workoutsTodaySubscription.unsubscribe();
    if (this.scheduleSubscription) this.scheduleSubscription.unsubscribe();
    if (this.bodyCompSubscription) this.bodyCompSubscription.unsubscribe();
    if (this.subscriptionSubscription) this.subscriptionSubscription.unsubscribe();
  }

  public loadUserDependentResources() {
    let today = new Date(this.dateToday.toDateString());
    let tomorrow = new Date(this.dateToday.getTime() + 86400000);
    tomorrow = new Date(tomorrow.toDateString());
    let yesterday = new Date(this.dateToday.getTime() - 86400000);
    yesterday = new Date(yesterday.toDateString());
    this.workoutsTodayObserv = this.workoutService.getClientWorkoutHeaders(this.user.id, today, tomorrow);
    this.workoutsTodaySubscription = this.workoutsTodayObserv.subscribe(workouts => this.workoutsToday = workouts);
    this.clientsSubscription = this.userService.getClients(this.user.id).subscribe(clients => {
      this.clients = clients;
      this.loadSchedules();
      this.loadBodyComps();
    });
    this.surveysSubscription = this.lifestyleService.getClientSurveys(this.user.id, yesterday).subscribe(surveys => this.surveysYesterday = surveys);
    this.workoutsYesterdaySubscription = this.workoutService.getClientWorkoutHeaders(this.user.id, yesterday, today).subscribe(workouts => this.workoutsYesterday = workouts);
    this.messagesSubscription = this.messageService.getTrainersUnreadMessages(this.user.id).subscribe(messages => this.unreadMessages = messages);
    this.subscriptionSubscription = this.paymentService.getTrainerSubscription(this.user.id).subscribe(subscriptions => {
      if (subscriptions.length > 0) this.trainerSubscription = subscriptions[0];
    });
  }

  public loadBodyComps(): void {
    for (let i = 0; i < this.clients.length; i++) {
      this.bodyCompSubscription = this.progressService.getBodyCompMeasurements(this.clients[i].id, this.addDays(-2, this.dateToday), this.dateToday).subscribe((measurements: BodyCompMeasurement[]) => {
        for (let j = 0; j < measurements.length; j++) {
          this.convertFirestoreTimestampsToDates(measurements[j]);
          this.bodyComps.push(measurements[j]);
        }
        if (i == (this.clients.length - 1)) this.bodyCompsLoaded = true;
      });
    }
  }
  
  public loadSchedules(): void {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].status == 'active') {
        this.scheduleSubscription = this.scheduleService.getSchedule(this.clients[i].id).subscribe((schedule: Schedule[]) => {
          for (let j = 0; j < schedule.length; j++) {
            if (schedule[j].meetingType) {
              this.setScheduleDate(schedule[j], this.dateToday);
              this.schedule.push(schedule[j]);
            }
          }
          this.schedule.sort((a: Schedule, b: Schedule) => this.scheduleSortOrder(a, b));
        });
      }
    }
  }

  public setScheduleDate(schedule: Schedule, dayInWeek: Date): void {
    let subjectDayOfWeek = dayInWeek.getDay() - 1; // Monday = 0
    if (subjectDayOfWeek == -1) subjectDayOfWeek = 6;
    schedule.displayTime = this.addDays(schedule.dayOfWeek - subjectDayOfWeek, dayInWeek)
    schedule.displayTime.setHours(schedule.hour, schedule.minute);
  }

  public scheduleSortOrder(a: Schedule, b: Schedule): number {
    let retVal: number = 0;
    let compareDateA = new Date(a.displayTime);
    let compareDateB = new Date(b.displayTime);
    if (a.meetingType == 'remote') compareDateA.setHours(23, 59);
    if (b.meetingType == 'remote') compareDateB.setHours(23, 59);
    if (compareDateB > compareDateA) retVal = -1;
    if (compareDateB < compareDateA) retVal = 1;
    if (compareDateB.getTime() == compareDateA.getTime()) {
      if ((this.getClient(b.userID).nameFirst + this.getClient(b.userID).nameLast) >= (this.getClient(a.userID).nameFirst + this.getClient(a.userID).nameLast)) {
        retVal = -1;
      } else {
        retVal = 1;
      }
    }
    return retVal;
  }

  public getClient(userID: string): User {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].id == userID) {
        return this.clients[i];
      }
    }
  }

  public programmingNeededFor(date: Date): Schedule[] {
    let missing: Schedule[] = [];
    for (let i = 0; i < this.schedule.length; i++) {
      if ((this.schedule[i].displayTime >= date) && (this.schedule[i].displayTime < this.addDays(1, date))) {
        if (!this.workoutExists(this.schedule[i])) missing.push(this.schedule[i]);
      }
    }
    return missing;
  }

  public workoutExists(schedule: Schedule): boolean {
    let retVal = false;
    for (let i = 0; i < this.workoutsToday.length; i++) {
      if ((this.workoutsToday[i].userID == schedule.userID) && (this.workoutsToday[i].assignmentDate.getTime() == schedule.displayTime.getTime())) retVal = true;
    }
    return retVal;
  }

  public addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
  }

  public onNewWorkoutFromReminder(schedule: Schedule): void {
    if (this.verifySubscription()) {
      this.userService.setActiveClient(this.getClient(schedule.userID));
      this.navigationService.fromRoute = 'dashboard-trainer';
      this.navigationService.createOnDate = schedule.displayTime;
      this.navigationService.createWithMeetingType = schedule.meetingType;
      this.router.navigate(['/', 'trainer', 'workouts', 'create', 'new-on-date-with-meetingtype']);
    }
  }

  public verifySubscription(): boolean {
    let passedCheck = true;
    if (this.user.planExpiration < this.dateToday) {
      passedCheck = false;
      this.displaySubscriptionExpiredDialog = true;
    }
    if (this.getActiveClientCount() > this.getPlanClientLimit(this.user.plan)) {
      passedCheck = false;
      this.displayExceededClientLimitDialog = true;
    }
    return passedCheck;
  }

  public onSelectWorkout(workout: Workout): void {
    this.userService.setActiveClient(this.findUser(workout.userID));
    this.router.navigate(['/', 'workouts', workout.id]);
  }

  public onSelectMessage(client: User): void {
    this.userService.setActiveClient(client);
    this.router.navigate(['/', 'messages']);
  }

  public findUser(userID: string): User {
    let foundUser: User;
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].id == userID) foundUser = this.clients[i];
    }
    return foundUser;
  }

  public completedSurvey(client: User): boolean {
    let retVal = false;
    for (let i = 0; i < this.surveysYesterday.length; i++) {
      if (this.surveysYesterday[i].userID == client.id) retVal = true;
    }
    return retVal;
  }

  public missedWorkout(client: User): boolean {
    let retVal = false;
    for (let i = 0; i < this.workoutsYesterday.length; i++) {
      if (this.workoutsYesterday[i].userID == client.id && this.workoutsYesterday[i].status == 'open') retVal = true;
    }
    return retVal;
  }

  public missedBodyComp(client: User): boolean {
    let missed = false;
    if (client.bodyCompImplemented && this.bodyCompDueWithinPastThreeDays(client)) {
      let foundRecord = false;
      for (let i = 0; i < this.bodyComps.length; i++) {
        if (this.bodyComps[i].userID == client.id) foundRecord = true;
      }
      if (!foundRecord) missed = true;
    }
    return missed;
  }

  public bodyCompDueWithinPastThreeDays(client: User): boolean {
    let isDue = false;
    if (this.jsDayOfWeek(client.bodyCompMeasurementDayOfWeek) == this.dateToday.getDay()) isDue = true;
    if (this.jsDayOfWeek(client.bodyCompMeasurementDayOfWeek) == this.addDays(-1, this.dateToday).getDay()) isDue = true;
    if (this.jsDayOfWeek(client.bodyCompMeasurementDayOfWeek) == this.addDays(-2, this.dateToday).getDay()) isDue = true;
    return isDue;
  }

  public unreadMessageCount(client: User): number {
    let count = 0;
    for (let i = 0; i < this.unreadMessages.length; i++) {
      if (this.unreadMessages[i].clientID == client.id) count++;
    }
    return count;
  }

  public workoutOverdue(workout: Workout): boolean {
    let retVal = false;
    let now = new Date();
    if (workout.status == 'open') {
      if (workout.meetingType == 'remote') {
        if ((now.getTime() - workout.assignmentDate.getTime()) > DAY_MSEC) retVal = true;
      } else {
        if ((now.getTime() - workout.assignmentDate.getTime()) > 3 * HOUR_MSEC) retVal = true;
      }
    }
    return retVal;
  }

  public getMissedAssignments(): MissedAssignment[] {
    let missedAssignments: MissedAssignment[] = [];
    for (let i = 0; i < this.clients.length; i++) {
      let anyMissed = false;
      let missedAssignment = {
        clientName: this.clients[i].nameFirst + ' ' + this.clients[i].nameLast, 
        missedWorkout: false, 
        missedSurvey: false, 
        missedBodyComp: false
      };
      if ((this.clients[i].status == 'active') && this.missedWorkout(this.clients[i])) {
        anyMissed = true;
        missedAssignment.missedWorkout = true;
      }
      if ((this.clients[i].status == 'active') && (!this.completedSurvey(this.clients[i]))) {
        anyMissed = true;
        missedAssignment.missedSurvey = true;
      }
      if ((this.clients[i].status == 'active') && this.missedBodyComp(this.clients[i])) {
        anyMissed = true;
        missedAssignment.missedBodyComp = true;
      }
      if (anyMissed) missedAssignments.push(missedAssignment);
    }
    return missedAssignments;
  }

  public formatDate(date: Date): string {
    const options = {weekday:'long', month:'long', day:'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

  public formatExpirationDate(date: Date): string {
    const options = {weekday:'long'};
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

  public dayDiff(startdate: Date, enddate: Date) {
    let dayCount = 0;
    let start = new Date(startdate);
    let end = new Date(enddate);
    if (end >= start) {
      while (end > start) {
        dayCount++;
        start.setDate(start.getDate() + 1);
      }
    } else {
      while (start > end) {
        dayCount--;
        end.setDate(end.getDate() + 1);
      }
    }
    return dayCount;
  }

  public getPlanClientLimit(plan: string): number {
    let clientLimit: number;
    for (let i = 0; i < this.plans.length; i++) {
      if (plan == this.plans[i][0]) clientLimit = this.plans[i][1];
    }
    return clientLimit;
  }

  public getActiveClientCount(): number {
    let count = 0;
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].status === 'active') count++;
    }
    return count;
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
