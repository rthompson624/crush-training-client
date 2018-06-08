import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../user/user.model';
import { Workout } from '../workout.model';
import { Segment } from '../segment.model';
import { Exercise } from '../exercise.model';
import { Movement } from '../movement.model';
import { UserMovementHistory } from '../user-movement-history.model';
import { WorkoutService } from '../workout.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Subscription';
import { UserService } from '../../user/user.service';
import { NavigationStateService } from '../../navigation/navigation-state.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { KeyFilterModule } from 'primeng/keyfilter';

@Component({
  selector: 'app-workout-edit',
  templateUrl: './workout-edit.component.html',
  styleUrls: ['./workout-edit.component.css']
})

export class WorkoutEditComponent implements OnInit, OnDestroy {
  public today: Date = new Date();
  public user: User;
  public subjectUser: User;
  public workout: Workout;
  public workoutLoadedSub: Subscription;
  public displayInvalidFormDialog: boolean = false;
  public movements: Movement[];
  public standardMovementsSubscription: Subscription;
  public trainerMovementsSubscription: Subscription;
  public userMovementHistory: UserMovementHistory[];
  public userMovementHistorySubscription: Subscription;
  public movementHistoryDialogTitle: string;
  public displayMovementHistoryDialog: boolean = false;
  public displayVideoDialog: boolean = false;
  public videoDialogTitle: string;
  public url: SafeResourceUrl;
  public initialUrl: string = 'https://www.youtube.com/embed/1Dh2coea0YI?rel=0&amp;controls=0&amp;showinfo=0';
  public firstSegmentWithMovement: Segment;

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private workoutService: WorkoutService, 
    private sanitizer: DomSanitizer, 
    private userService: UserService, 
    private navigationService: NavigationStateService
  ) { }

  ngOnInit() {
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
      const workoutID = this.route.snapshot.paramMap.get('id');
      this.workout = this.workoutService.getWorkoutByID(workoutID);
      this.workoutLoadedSub = this.workoutService.workoutLoaded.subscribe(
        (workout: Workout) => {
          this.workout = workout;
          this.setZeroWeightsToNull();
          this.setIfHasMovement();
        }
      );
      this.standardMovementsSubscription = this.workoutService.getStandardMovements().subscribe(standardMovements => {
        this.movements = standardMovements;
        let trainerID = this.subjectUser.type == 'trainer' ? this.subjectUser.id : this.subjectUser.trainerID;
        this.trainerMovementsSubscription = this.workoutService.getTrainerMovements(trainerID).subscribe(trainerMovements => {
          this.movements = this.movements.concat(trainerMovements);
          this.movements.sort((a, b) => a.name.localeCompare(b.name));
        });
        
      });
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.initialUrl);
    }
  }

  ngOnDestroy() {
    if (this.workoutLoadedSub) this.workoutLoadedSub.unsubscribe();
    if (this.standardMovementsSubscription) this.standardMovementsSubscription.unsubscribe();
    if (this.trainerMovementsSubscription) this.trainerMovementsSubscription.unsubscribe();
  }

  public setZeroWeightsToNull(): void {
    for (let i = 0; i < this.workout.segments.length; i++) {
      if (this.workout.segments[i].exercises) {
        for (let j = 0; j < this.workout.segments[i].exercises.length; j++) {
          if (this.workout.segments[i].exercises[j].weight == 0) this.workout.segments[i].exercises[j].weight = null;
          if (this.workout.segments[i].exercises[j].repsLastSet == 0) this.workout.segments[i].exercises[j].repsLastSet = null;
        }
      }
    }
  }

  public setIfHasMovement(): void {
    let found = false;
    for (let i = 0; i < this.workout.segments.length; i++) {
      if (!found && ((this.workout.segments[i].type == 'singleset') || (this.workout.segments[i].type == 'superset'))) {
        this.firstSegmentWithMovement = this.workout.segments[i];
        found = true;
      }
    }
  }

  public submitWorkout(): void {
    if (this.isFormValid()) {
      this.workout.status = 'complete';
      this.workout.submittedDate = new Date();
      this.workoutService.updateWorkout(this.workout);
      this.workoutService.addUserMovementHistory(this.workout);
      if (this.user.type == 'trainer') {
        this.router.navigate(['/', 'dashboard-trainer']);
      } else {
        this.router.navigate(['/', 'dashboard']);
      }
    } else {
      this.displayInvalidFormDialog = true;
    }
  }

  public onEditWorkout(): void {
    this.navigationService.fromRoute = 'workouts';
    this.router.navigate(['/', 'trainer', 'workouts', 'create', this.workout.id]);
  }

  public isFormValid(): boolean {
    let formValid = true;
    for (let i = 0; i < this.workout.segments.length; i++) {
      if (this.workout.segments[i].type == 'circuit') {
        if (!this.workout.segments[i].circuitResult) formValid = false;
      }
      if (this.workout.segments[i].exercises) {
        for (let j = 0; j < this.workout.segments[i].exercises.length; j++) {
          if (!this.workout.segments[i].exercises[j].weight) formValid = false;
          if (!this.workout.segments[i].exercises[j].repsLastSet) formValid = false;
        }
      }
    }
    return formValid;
  }

  public getDemoUrl(movementID: string): string {
    let youtubeID = '';
    let urlPrefix = 'https://www.youtube.com/embed/';
    let urlSuffix = '?rel=0&amp;controls=0&amp;showinfo=0';
    for (let i = 0; i < this.movements.length; i++) {
      if (this.movements[i].id == movementID) youtubeID = this.movements[i].youtubeID;
    }
    return urlPrefix + youtubeID + urlSuffix;
  }

  public displayMovementHistory (movementID: string): void {
    this.userMovementHistorySubscription = this.workoutService.getUserMovementHistory(this.subjectUser.id, movementID).subscribe(userMovementHistory => this.userMovementHistory = userMovementHistory);
    this.movementHistoryDialogTitle = this.getMovementName(movementID);
    this.displayMovementHistoryDialog = true;
  }

  public onCloseMovementHistoryDialog(): void {
    this.userMovementHistorySubscription.unsubscribe();
  }

  public playVideo(movementID: string): void {
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.getDemoUrl(movementID));
    this.videoDialogTitle = this.getMovementName(movementID);
    this.displayVideoDialog = true;
  }

  public onCloseVideoDialog(): void {
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.initialUrl);
  }

  public getMovementName(movementID: string): string {
    for (let i = 0; i < this.movements.length; i++) {
      if (this.movements[i].id == movementID) return this.movements[i].name;
    }
    return null;
  }

  public formatMultiline(value: string): string {
    return value.replace(/[\n\r]/g, '<br>');
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

  public formatLongDate(date: Date): string {
    const options = {weekday:'long', month:'long', day:'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

}
