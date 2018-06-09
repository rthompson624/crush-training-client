import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../user/user.model';
import { Workout } from '../workout.model';
import { Segment } from '../segment.model';
import { Exercise } from '../exercise.model';
import { WorkoutService } from '../workout.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../user/user.service';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-workout-list',
  templateUrl: './workout-list.component.html',
  styleUrls: ['./workout-list.component.css']
})
export class WorkoutListComponent implements OnInit, OnDestroy {
  public user: User;
  public workout: Workout;
  public activeDate: Date;
  public workoutLoadedSub: Subscription;

  constructor(private router: Router, private workoutService: WorkoutService, private userService: UserService) { }

  ngOnInit() {
    this.activeDate = new Date();
    this.user = this.userService.getActiveUser();
    this.workout = this.workoutService.getWorkout(this.user.id, this.activeDate);
    this.workoutLoadedSub = this.workoutService.workoutLoaded.subscribe(
      (workout: Workout) => {
        this.workout = workout;
      }
    );
  }

  ngOnDestroy() {
    this.workoutLoadedSub.unsubscribe();
  }

  public onGoToPreviousDay(): void {
    var ms = this.activeDate.getTime() - 86400000;
    this.activeDate = new Date(ms);
    this.workout = this.workoutService.getWorkout(this.user.id, this.activeDate);
  }

  public onGoToNextDay(): void {
    var ms = this.activeDate.getTime() + 86400000;
    this.activeDate = new Date(ms);
    this.workout = this.workoutService.getWorkout(this.user.id, this.activeDate);
  }

  public onSelectWorkout(): void {
    this.router.navigate(['/', 'workouts', this.workout.id]);
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

}
