import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStateService } from '../navigation/navigation-state.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import { Schedule } from '../user/schedule.model';
import { ScheduleService } from '../user/schedule.service';
import { WorkoutService } from '../workout/workout.service';
import { Workout } from '../workout/workout.model';
import { Segment } from '../workout/segment.model';
import { Exercise } from '../workout/exercise.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { environment } from '../../environments/environment';

const DAY_MSEC: number = 86400000;
const HOUR_MSEC: number = 3600000;

@Component({
  selector: 'app-calendar-week',
  templateUrl: './calendar-week.component.html',
  styleUrls: ['./calendar-week.component.css']
})
export class CalendarWeekComponent implements OnInit, OnDestroy {
  public user: User;
  public subjectUser: User;
  public isTrainer: boolean = false;
  public subjectDay: Date;
  public today: Date;
  public daysOfWeek: Date[] = [];
  public workoutHeadersSubscription: Subscription;
  public workoutLoadedSubscription: Subscription;
  public workouts: Workout[] = [];
  public displayDeleteDialog: boolean = false;
  public displayCopyDialog: boolean = false;
  public displayCopyAppendOrReplaceDialog: boolean = false;
  public displayClientSelectDialog: boolean = false;
  public displayPasteErrorDialog: boolean = false;
  public workoutToDelete: Workout;
  public workoutToCopy: Workout;
  public workoutClipboard: Workout[] = [];
  public workoutsSelected: number = 0;
  public clients: User[];
  public clientsSubscription: Subscription;
  public clientSelectItems: SelectItem[] = [];
  public scheduleSubscription: Subscription;
  public schedule: Schedule[] = [];
  public selectedClientID: string;
  public showAllClients: boolean = false;
  public clientDialogSelectItems: SelectItem[] = [];
  public selectedDialogClientID: string;
  public dayToCreateWorkout: Date;
  public workoutCreationMode: string = 'new';
  public plans: any[] = environment.stripePlans;
  public displaySubscriptionExpiredDialog: boolean = false;
  public displayExceededClientLimitDialog: boolean = false;

  constructor(
    private router: Router, 
    private workoutService: WorkoutService, 
    private userService: UserService, 
    private navigationService: NavigationStateService, 
    private scheduleService: ScheduleService
  ) { }

  ngOnInit() {
    this.initializeDates();
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.initializeUser();
      this.initializeWorkoutLoadingCallback();
      this.loadWorkoutHeaders();
      this.loadClients();
    }
  }

  ngOnDestroy() {
    if (this.workoutHeadersSubscription) this.workoutHeadersSubscription.unsubscribe();
    if (this.workoutLoadedSubscription) this.workoutLoadedSubscription.unsubscribe();
    if (this.clientsSubscription) this.clientsSubscription.unsubscribe();
    if (this.scheduleSubscription) this.scheduleSubscription.unsubscribe();
  }

  public initializeDates(): void {
    if (this.navigationService.fromRoute == 'trainer/workouts/create') {
      this.navigationService.fromRoute = '';
      this.subjectDay = this.navigationService.createOnDate;
    } else {
      this.subjectDay = new Date();
    }
    this.subjectDay = new Date(this.subjectDay.toDateString());
    this.today = new Date();
    this.today = new Date(this.today.toDateString());
    this.setInitialWeekRange();
  }

  public initializeUser(): void {
    if (this.navigationService.calendarView == 'all-clients') this.showAllClients = true;
    this.user = this.userService.getActiveUser();
    if (this.user.type == 'trainer') {
      this.isTrainer = true;
      this.subjectUser = this.userService.getActiveClient();
    } else {
      this.subjectUser = this.userService.getActiveUser();
    }
  }

  public loadWorkoutHeaders(): void {
    if (this.workoutHeadersSubscription) this.workoutHeadersSubscription.unsubscribe();
    this.workouts.splice(0, this.workouts.length); // clear array
    if (this.showAllClients) {
      this.workoutHeadersSubscription = this.workoutService.getClientWorkoutHeaders(this.user.id, this.daysOfWeek[0], this.addDays(1, this.daysOfWeek[6])).subscribe(
        (workoutHeaders: Workout[]) => {
          this.loadWorkouts(workoutHeaders);
        }
      );
    } else {
      this.workoutHeadersSubscription = this.workoutService.getWorkoutHeaders(this.subjectUser.id, this.daysOfWeek[0], this.addDays(1, this.daysOfWeek[6])).subscribe(
        (workoutHeaders: Workout[]) => {
          this.loadWorkouts(workoutHeaders);
        }
      );
    }
  }

  public loadWorkouts(workoutHeaders: Workout[]): void {
    for (let i = 0; i < workoutHeaders.length; i++) {
      this.workoutService.getWorkoutByID(workoutHeaders[i].id);
    }
  }

  public initializeWorkoutLoadingCallback(): void {
    // Callback function for loading workouts
    this.workoutLoadedSubscription = this.workoutService.workoutLoaded.subscribe(
      (workout: Workout) => {
        for (let i = 0; i < this.workouts.length; i++) {
          if (this.workouts[i].id == workout.id) this.workouts.splice(i, 1);
        }
        this.workouts.push(workout);
        this.workouts.sort((a: Workout, b: Workout) => this.workoutSortOrder(a, b));
      }
    );
  }

  public workoutsFor(date: Date): Workout[] {
    let retVal: Workout[] = [];
    for (let i = 0; i < this.workouts.length; i++) {
      if ((this.workouts[i].assignmentDate >= date) && (this.workouts[i].assignmentDate < this.addDays(1, date))) retVal.push(this.workouts[i]);
    }
    return retVal;
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

  public loadClients(): void {
    this.clientsSubscription = this.userService.getClients(this.user.id).subscribe(clients => {
      this.clients = clients;
      this.clientSelectItems.push({label: 'All Clients', value: 'all-clients'});
      this.clientDialogSelectItems.push({label: '', value: null});
      for (let i = 0; i < clients.length; i++) {
        if (clients[i].status == 'active') {
          this.clientSelectItems.push({label: clients[i].nameFirst + ' ' + clients[i].nameLast, value: clients[i].id});
          this.clientDialogSelectItems.push({label: clients[i].nameFirst + ' ' + clients[i].nameLast, value: clients[i].id});
        }
      }
      if (this.showAllClients) {
        this.selectedClientID = 'all-clients';
      } else {
        this.selectedClientID = this.subjectUser.id;
      }
      this.loadSchedules();
    });
  }

  public loadSchedules(): void {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].status == 'active') {
        this.scheduleSubscription = this.scheduleService.getSchedule(this.clients[i].id).subscribe((schedule: Schedule[]) => {
          for (let j = 0; j < schedule.length; j++) {
            if (schedule[j].meetingType) {
              this.setScheduleDate(schedule[j], this.subjectDay);
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

  public programmingNeededFor(date: Date): Schedule[] {
    let missing: Schedule[] = [];
    // Don't return record if it is in the past
    let today: Date = new Date();
    today = new Date(today.toDateString());
    if (date.getTime() >= today.getTime()) {
      for (let i = 0; i < this.schedule.length; i++) {
        if ((this.schedule[i].displayTime >= date) && (this.schedule[i].displayTime < this.addDays(1, date))) {
          if (this.showAllClients) {
            if (!this.workoutExists(this.schedule[i])) missing.push(this.schedule[i]);
          } else {
            if (this.schedule[i].userID == this.subjectUser.id) {
              if (!this.workoutExists(this.schedule[i])) missing.push(this.schedule[i]);
            }
          }
        }
      }
    }
    return missing;
  }

  public refreshScheduleDates(): void {
    for (let i = 0; i < this.schedule.length; i++) {
      this.setScheduleDate(this.schedule[i], this.daysOfWeek[0]);
    }
  }

  public workoutExists(schedule: Schedule): boolean {
    let retVal = false;
    for (let i = 0; i < this.workouts.length; i++) {
      if ((this.workouts[i].userID == schedule.userID) && (this.workouts[i].assignmentDate.getTime() == schedule.displayTime.getTime())) retVal = true;
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

  public changeClients(): void {
    this.workoutsSelected = 0;
    if (this.selectedClientID != 'all-clients') {
      this.showAllClients = false;
      this.navigationService.calendarView = 'single-client';
      this.subjectUser = this.getClient(this.selectedClientID);
      this.userService.setActiveClient(this.subjectUser);
    } else {
      this.showAllClients = true;
      this.navigationService.calendarView = 'all-clients';
    }
    this.loadWorkoutHeaders();
  }

  public onNewWorkout(day: Date): void {
    if (this.verifySubscription()) {
      if (this.showAllClients) {
        this.dayToCreateWorkout = day;
        this.workoutCreationMode = 'new'
        this.displayClientSelectDialog = true;
      } else {
        this.newWorkout(day);
      }
    }
  }

  public verifySubscription(): boolean {
    let passedCheck = true;
    if (this.user.planExpiration < this.today) {
      passedCheck = false;
      this.displaySubscriptionExpiredDialog = true;
    }
    if (this.getActiveClientCount() > this.getPlanClientLimit(this.user.plan)) {
      passedCheck = false;
      this.displayExceededClientLimitDialog = true;
    }
    return passedCheck;
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

  public newWorkout(day: Date): void {
    this.userService.setActiveClient(this.subjectUser);
    day.setHours(8);
    this.navigationService.fromRoute = 'calendar';
    this.navigationService.createOnDate = day;
    this.router.navigate(['/', 'trainer', 'workouts', 'create', 'new-on-date']);
  }

  public onNewWorkoutFromReminder(schedule: Schedule): void {
    if (this.verifySubscription()) {
      this.userService.setActiveClient(this.getClient(schedule.userID));
      this.navigationService.fromRoute = 'calendar';
      this.navigationService.createOnDate = schedule.displayTime;
      this.navigationService.createWithMeetingType = schedule.meetingType;
      this.router.navigate(['/', 'trainer', 'workouts', 'create', 'new-on-date-with-meetingtype']);
    }
  }

  public onPasteWorkouts(day: Date): void {
    if (this.verifySubscription()) {
      if (this.workoutClipboard.length > 0) {
        if (this.showAllClients) {
          this.dayToCreateWorkout = day;
          this.workoutCreationMode = 'paste'
          this.displayClientSelectDialog = true;
        } else {
          this.pasteWorkoutsFromClipboard(day);
        }
      } else {
        this.displayPasteErrorDialog = true;
      }
    }
  }

  public onSelectClientDialog(): void {
    if (this.selectedDialogClientID) {
      this.subjectUser = this.getClient(this.selectedDialogClientID);
      this.selectedDialogClientID = null;
      if (this.workoutCreationMode == 'paste') {
        this.pasteWorkoutsFromClipboard(this.dayToCreateWorkout);
      } else if (this.workoutCreationMode == 'new') {
        this.newWorkout(this.dayToCreateWorkout);
      }
    }
    this.displayClientSelectDialog = false;
    this.selectedDialogClientID = null;
  }

  public pasteWorkoutsFromClipboard(start: Date): void {
    let firstWorkoutDate = new Date(this.workoutClipboard[0].assignmentDate.toDateString());
    let dayOffset = this.dayDiff(firstWorkoutDate, start);
    for (let i = 0; i < this.workoutClipboard.length; i++) {
      this.pasteWorkout(this.workoutClipboard[i], this.addDays(dayOffset, this.workoutClipboard[i].assignmentDate))
    }
  }

  public pasteWorkout(workoutToCopy: Workout, date: Date): void {
    let newCopy: Workout = new Workout(null, new Date(date), 'open', null, this.subjectUser.id, this.user.id);
    newCopy.meetingType = workoutToCopy.meetingType;
    newCopy.userName = this.subjectUser.nameFirst + ' ' + this.subjectUser.nameLast;
    for (let i = 0; i < workoutToCopy.segments.length; i++) {
      newCopy.segments.push(new Segment(
        null, 
        workoutToCopy.segments[i].order, 
        workoutToCopy.segments[i].type, 
        workoutToCopy.segments[i].circuitName, 
        workoutToCopy.segments[i].circuitDescription, 
        null
      ));
      if (workoutToCopy.segments[i].exercises) {
        for (let j = 0; j < workoutToCopy.segments[i].exercises.length; j++) {
          newCopy.segments[i].exercises.push(new Exercise(
            null, 
            workoutToCopy.segments[i].exercises[j].order, 
            workoutToCopy.segments[i].exercises[j].movementID, 
            workoutToCopy.segments[i].exercises[j].movement, 
            workoutToCopy.segments[i].exercises[j].sets, 
            workoutToCopy.segments[i].exercises[j].reps, 
            null
          ));
        }
      }
    }
    this.workoutService.updateWorkout(newCopy);
  }

  public onStartWorkout(workout: Workout): void {
    this.userService.setActiveClient(this.getClient(workout.userID));
    this.router.navigate(['/', 'workouts', workout.id]);
  }

  public onEditWorkout(workout: Workout): void {
    this.userService.setActiveClient(this.getClient(workout.userID));
    this.navigationService.fromRoute = 'calendar';
    this.router.navigate(['/', 'trainer', 'workouts', 'create', workout.id]);
  }

  public onSelectWorkout(selected: boolean): void {
    if (selected) this.workoutsSelected++; else this.workoutsSelected--;
  }

  public onSelectCopyWorkouts(): void {
    if (this.verifySubscription()) {
      if (this.workoutClipboard.length > 0) {
        this.displayCopyAppendOrReplaceDialog = true;
      } else {
        this.copyWorkouts(true);
      }
    }
  }

  public copyWorkouts(replace: boolean): void {
    if (replace) this.workoutClipboard.length = 0;
    for (let i = 0; i < this.workouts.length; i++) {
      if (this.workouts[i].selected) {
        this.workouts[i].selected = false;
        this.workoutsSelected--;
        this.workoutClipboard.push(this.workouts[i]);
        this.workoutClipboard.sort((a: Workout, b: Workout) => this.workoutSortOrder(a, b));
      }
    }
    this.displayCopyDialog = true;
  }

  public onDeleteWorkout(workout: Workout): void {
    this.workoutToDelete = workout;
    this.displayDeleteDialog = true;
  }

  public onDeleteWorkoutConfirmed(): void {
    this.displayDeleteDialog = false;
    this.workoutService.deleteWorkout(this.workoutToDelete.id);
    for (let i = 0; i < this.workouts.length; i++) {
      if (this.workouts[i].id == this.workoutToDelete.id) this.workouts.splice(i, 1);
    }
    this.workoutToDelete = null;
  }

  public setInitialWeekRange(): void {
    this.daysOfWeek.splice(0, this.daysOfWeek.length); // clear array
    let dayOfWeek = this.subjectDay.getDay() - 1; // Monday = 0
    if (dayOfWeek == -1) dayOfWeek = 6;
    this.daysOfWeek[0] = this.addDays(-dayOfWeek, this.subjectDay); // Monday 12 AM
    for (let i = 1; i < 7; i++) {
      this.daysOfWeek[i] = this.addDays(1, this.daysOfWeek[i - 1]); // Last day Sunday 12 AM
    }
  }

  public addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
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

  public onGoToPreviousWeek(): void {
    let start = this.addDays(-7, this.daysOfWeek[0]);
    this.daysOfWeek.splice(0, this.daysOfWeek.length); // clear array
    this.daysOfWeek[0] = start; // Monday 12 AM
    for (let i = 1; i < 7; i++) {
      this.daysOfWeek[i] = this.addDays(1, this.daysOfWeek[i - 1]); // Last day Sunday 12 AM
    }
    this.workoutsSelected = 0;
    this.loadWorkoutHeaders();
    this.refreshScheduleDates();
  }

  public onGoToNextWeek(): void {
    let start = this.addDays(7, this.daysOfWeek[0]);
    this.daysOfWeek.splice(0, this.daysOfWeek.length); // clear array
    this.daysOfWeek[0] = start; // Monday 12 AM
    for (let i = 1; i < 7; i++) {
      this.daysOfWeek[i] = this.addDays(1, this.daysOfWeek[i - 1]); // Last day Sunday 12 AM
    }
    this.workoutsSelected = 0;
    this.loadWorkoutHeaders();
    this.refreshScheduleDates();
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

  public getWeekText(): string {
    return this.formatDate(this.daysOfWeek[0]) + ' - ' + this.formatDate(this.daysOfWeek[6]);
  }

  public formatDate(date: Date): string {
    const options = {weekday:'short', month:'short', day:'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

  public formatLongDate(date: Date): string {
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

}
