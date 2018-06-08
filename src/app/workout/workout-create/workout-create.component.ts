import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../user/user.model';
import { Workout } from '../workout.model';
import { Segment } from '../segment.model';
import { Exercise } from '../exercise.model';
import { Movement } from '../movement.model';
import { UserMovementHistory } from '../user-movement-history.model';
import { WorkoutService } from '../workout.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { KeyFilterModule } from 'primeng/keyfilter';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Subscription';
import { UserService } from '../../user/user.service';
import { NavigationStateService } from '../../navigation/navigation-state.service';

@Component({
  selector: 'app-workout-create',
  templateUrl: './workout-create.component.html',
  styleUrls: ['./workout-create.component.css']
})
export class WorkoutCreateComponent implements OnInit, OnDestroy {
  public user: User;
  public client: User;
  public workout: Workout;
  public workoutSubscription: Subscription;
  public movements: Movement[];
  public movementSuggestions: Movement[];
  public standardMovementsSubscription: Subscription;
  public trainerMovementsSubscription: Subscription;
  public displaySaveDialog: boolean = false;
  public saveDialogMessage: string;
  public saveDialogIssues: string[] = [];
  public userMovementHistory: UserMovementHistory[];
  public userMovementHistorySubscription: Subscription;
  public displayMovementHistoryDialog: boolean = false;
  public movementHistoryDialogTitle: string;
  public displayVideoDialog: boolean = false;
  public videoDialogTitle: string;
  public url: SafeResourceUrl;
  public initialUrl: string = 'https://www.youtube.com/embed/1Dh2coea0YI?rel=0&amp;controls=0&amp;showinfo=0';
  public segmentTypes: SelectItem[];

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private workoutService: WorkoutService, 
    private sanitizer: DomSanitizer, 
    private userService: UserService, 
    private navigationService: NavigationStateService
  ) { 
    this.segmentTypes = [
      {label: 'Straight Set', value: 'singleset'},
      {label: 'Superset', value: 'superset'},
      {label: 'Circuit', value: 'circuit'}
    ]
  }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.client = this.userService.getActiveClient();
      const workoutID = this.route.snapshot.paramMap.get('id');
      if (workoutID.includes('new')) {
        let assignmentDate: Date;
        let meetingType: string = 'inperson';
        if (workoutID == 'new-on-date') assignmentDate = this.navigationService.createOnDate;
        if (workoutID == 'new-on-date-with-meetingtype') {
          assignmentDate = this.navigationService.createOnDate;
          meetingType = this.navigationService.createWithMeetingType;
        }
        this.workout = new Workout(null, assignmentDate, 'open', null, this.client.id, this.user.id);
        this.workout.meetingType = meetingType;
        this.workout.userName = this.client.nameFirst + ' ' + this.client.nameLast;
        this.workout.segments = [new Segment(null, 'A', 'singleset', null, null, null)];
        this.workout.segments[0].exercises = [new Exercise(null, 1, null, null, null, null, null)];
      }
      this.standardMovementsSubscription = this.workoutService.getStandardMovements().subscribe(standardMovements => {
        this.movements = standardMovements;
        this.trainerMovementsSubscription = this.workoutService.getTrainerMovements(this.user.id).subscribe(trainerMovements => {
          this.movements = this.movements.concat(trainerMovements);
          this.movements.sort((a, b) => a.name.localeCompare(b.name));
          if (!workoutID.includes('new')) {
            this.workout = this.workoutService.getWorkoutByID(workoutID);
            this.workoutSubscription = this.workoutService.workoutLoaded.subscribe(workout => {
              this.workout = workout;
              this.populateMovementSelection();
            });
          }
        });
      });
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.initialUrl);
    }
  }

  ngOnDestroy() {
    if (this.standardMovementsSubscription) this.standardMovementsSubscription.unsubscribe();
    if (this.trainerMovementsSubscription) this.trainerMovementsSubscription.unsubscribe();
    if (this.workoutSubscription) this.workoutSubscription.unsubscribe();
  }

  public onSelectInPerson(): void {
    if (this.workout.assignmentDate) {
      this.workout.assignmentDate.setHours(8);
      this.workout.assignmentDate.setMinutes(0);
      this.workout.assignmentDate.setSeconds(0);
    }
  }

  public onSelectRemote(): void {
    if (this.workout.assignmentDate) {
      this.workout.assignmentDate.setHours(0);
      this.workout.assignmentDate.setMinutes(0);
      this.workout.assignmentDate.setSeconds(0);
    }
  }

  public onMovementSelected(exercise: Exercise): void {
    exercise.movementID = exercise.movementSelection.id;
    exercise.movement = exercise.movementSelection.name;
  }

  public onDateFocus(): void {
    if (!this.workout.assignmentDate) {
      let date = new Date();
      date.setHours(8);
      date.setMinutes(0);
      date.setSeconds(0);
      this.workout.assignmentDate = date;
    }
  }

  public addExercise(segment: Segment): void {
    segment.exercises.push(new Exercise(null, segment.exercises.length + 1, null, null, null, null, null));
  }

  public removeExercise(segment: Segment, exercise: Exercise): void {
    let indexToRemove = 0;
    for (let i = 0; i < segment.exercises.length; i++) {
      if (segment.exercises[i].order == exercise.order) indexToRemove = i;
    }
    segment.exercises.splice(indexToRemove, 1);
    segment.exercises[0].order = 1;
    for (let i = 1; i < segment.exercises.length; i++) {
      segment.exercises[i].order = segment.exercises[i - 1].order + 1;
    }
  }

  public addSegment(): void {
    this.workout.segments.push(new Segment(null, this.getNextLetter(this.workout.segments[this.workout.segments.length - 1].order), 'singleset', null, null, null));
    this.workout.segments[this.workout.segments.length - 1].exercises = [new Exercise(null, 1, null, null, null, null, null)];
  }

  public removeSegment(segment: Segment): void {
    let indexToRemove = 0;
    for (let i = 0; i < this.workout.segments.length; i++) {
      if (this.workout.segments[i].order == segment.order) indexToRemove = i;
    }
    this.workout.segments.splice(indexToRemove, 1);
    this.workout.segments[0].order = 'A';
    for (let i = 1; i < this.workout.segments.length; i++) {
      this.workout.segments[i].order = this.getNextLetter(this.workout.segments[i - 1].order);
    }
  }

  public getNextLetter(letter: string): string {
    return letter.substring(0, letter.length - 1) + String.fromCharCode(letter.charCodeAt(letter.length - 1) + 1);
  }
  
  public searchMovements(event): void {
    let valueEntered: string = event.query;
    let values: string[] = valueEntered.split(' ');
    let movementSuggestions: Movement[] = [];
    for (let i = 0; i < this.movements.length; i++) {
      let matchCount = 0;
      for (let j = 0; j < values.length; j++) {
        if (this.movements[i].name.toLowerCase().indexOf(values[j].toLowerCase()) >= 0) matchCount++;
      }
      if (matchCount == values.length) movementSuggestions.push(this.movements[i]);
    }
    this.movementSuggestions = movementSuggestions;
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

  public onSegmentTypeChange(segment: Segment): void {
    if (segment.type == 'circuit') {
      segment.exercises = [];
    } else {
      segment.exercises = [new Exercise(null, 1, null, null, null, null, null)];
      segment.circuitDescription = null;
      segment.circuitName = null;
      segment.circuitResult = null;
    }
  }

  public saveWorkout(): void {
    if (this.isFormValid()) {
      // this.populateMovementIDandName();
      this.workoutService.updateWorkout(this.workout);
      this.saveDialogMessage = 'Workout has been saved.';
      this.saveDialogIssues = [];
    } else {
      this.saveDialogMessage = 'Workout could NOT be saved...';
    }
    this.displaySaveDialog = true;
  }

  public hideSaveDialog(): void {
    this.displaySaveDialog = false;
    if (this.saveDialogIssues.length == 0) {
      this.navigationService.createOnDate = this.workout.assignmentDate;
      if (this.navigationService.fromRoute == 'calendar') {
        this.navigationService.fromRoute = 'trainer/workouts/create';
        this.router.navigate(['/', 'calendar']);
      } else if (this.navigationService.fromRoute == 'workouts') {
        this.router.navigate(['/', 'workouts', this.workout.id]);
      } else if (this.navigationService.fromRoute == 'dashboard-trainer') {
        this.router.navigate(['/', 'dashboard-trainer']);
      }
    }
  }

  public addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
  }

  public isFormValid(): boolean {
    this.saveDialogIssues = [];
    if (!this.workout.assignmentDate) this.saveDialogIssues.push('Date missing');
    for (let i = 0; i < this.workout.segments.length; i++) {
      if (this.workout.segments[i].type == 'circuit') {
        if (!this.workout.segments[i].circuitName) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Circuit Name missing');
        if (!this.workout.segments[i].circuitDescription) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Circuit Description missing');
      } else if (this.workout.segments[i].type == 'superset') {
        for (let j = 0; j < this.workout.segments[i].exercises.length; j++) {
          if (!this.workout.segments[i].exercises[j].movementSelection) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Movement (' + this.workout.segments[i].exercises[j].order + ') missing');
          if (!this.workout.segments[i].exercises[j].sets) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Movement (' + this.workout.segments[i].exercises[j].order + ') Sets missing');
          if (!this.workout.segments[i].exercises[j].reps) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Movement (' + this.workout.segments[i].exercises[j].order + ') Reps missing');
        }
      } else if (this.workout.segments[i].type == 'singleset') {
        if (!this.workout.segments[i].exercises[0].movementSelection) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Movement missing');
        if (!this.workout.segments[i].exercises[0].sets) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Sets missing');
        if (!this.workout.segments[i].exercises[0].reps) this.saveDialogIssues.push('Segment ' + this.workout.segments[i].order + ': Reps missing');
      }
    }
    if (this.saveDialogIssues.length == 0) {
      return true;
    } else {
      return false;
    }
  }

  public populateMovementSelection(): void {
    for (let i = 0; i < this.workout.segments.length; i++) {
      if (this.workout.segments[i].exercises) {
        for (let j = 0; j < this.workout.segments[i].exercises.length; j++) {
          this.workout.segments[i].exercises[j].movementSelection = this.getMovementObject(this.workout.segments[i].exercises[j].movementID);
        }
      }
    }
  }

  public displayMovementHistory (movementID: string): void {
    this.userMovementHistorySubscription = this.workoutService.getUserMovementHistory(this.client.id, movementID).subscribe(userMovementHistory => this.userMovementHistory = userMovementHistory);
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

  public getMovementObject(movementID: string): Movement {
    for (let i = 0; i < this.movements.length; i++) {
      if (this.movements[i].id == movementID) return this.movements[i];
    }
    return null;
  }

}
