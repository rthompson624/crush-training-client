import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { BodyCompMeasurement } from './body-comp-measurement.model';
import { ProgressService } from './progress.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import { Survey } from '../lifestyle/survey.model';
import { LifestyleService } from '../lifestyle/lifestyle.service';
import { WorkoutService } from '../workout/workout.service';
import { Workout } from '../workout/workout.model';
import { Segment } from '../workout/segment.model';
import { Exercise } from '../workout/exercise.model';
import { Movement } from '../workout/movement.model';
import { Router } from '@angular/router';
import { Subscription ,  Observable } from 'rxjs';
import { AngularFireStorage } from 'angularfire2/storage';
import { ChartModule } from 'primeng/chart';
import { CalendarModule, Calendar } from 'primeng/calendar';
import { GalleriaModule } from 'primeng/galleria';
import { UserMovementHistory } from '../workout/user-movement-history.model';

interface WorkoutSummary {
  inPersonScheduled: number;
  inPersonCompleted: number;
  inPersonSuccessRate: string;
  remoteScheduled: number;
  remoteCompleted: number;
  remoteSuccessRate: string;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit, OnDestroy {
  public user: User;
  public subjectUser: User;
  public titleText: string;
  public sevenDaySummary: WorkoutSummary;
  public thirtyDaySummary: WorkoutSummary;
  public lifestyleChartData: any;
  public lifestyleChartOptions: any;
  public lifestyleDateRange: Date[];
  public oneRepMaxChartData: any;
  public oneRepMaxChartOptions: any;
  public bodyCompMeasurements: BodyCompMeasurement[] = [];
  public bodyCompChartData: any;
  public bodyCompChartOptions: any;
  public today: Date;
  public movementSelection: Movement;
  public movementSuggestions: Movement[];
  public movementLibrary: Movement[];
  public standardMovementsSubscription: Subscription;
  public trainerMovementsSubscription: Subscription;
  public oneRepMaxDateRange: Date[];
  public bodyCompDateRange: Date[];
  public progressPics: any[];
  public leftPicIndex: number;
  public rightPicIndex: number;
  // Following are to force p-calendar control to close upon selection of the second date in the date range
  @ViewChild('lifestyleCalendar') lifestyleCalendar: Calendar;
  public lifestyleCalendarOnDateSelectHandler: (event: any, dateMeta: any) => void;
  @ViewChild('oneRepMaxCalendar') oneRepMaxCalendar: Calendar;
  public oneRepMaxCalendarOnDateSelectHandler: (event: any, dateMeta: any) => void;
  @ViewChild('bodyCompCalendar') bodyCompCalendar: Calendar;
  public bodyCompCalendarOnDateSelectHandler: (event: any, dateMeta: any) => void;

  constructor(
    private router: Router, 
    private workoutService: WorkoutService, 
    private userService: UserService, 
    private afStorage: AngularFireStorage, 
    private progressService: ProgressService, 
    private lifestyleService: LifestyleService
  ) { }

  ngOnInit() {
    this.initializeDates();
    this.initializeUser();
    this.loadWorkoutData();
    this.loadLifestyleData();
    this.loadLifestyleChartOptions();
    this.loadMovementLibrary();
    this.loadOneRepMaxChartOptions();
    this.loadBodyCompData();
    this.loadBodyCompChartOptions();
    this.lifestyleCalendarOnDateSelectHandler = this.lifestyleCalendar.onDateSelect;
    this.lifestyleCalendar.onDateSelect = ((event: any, dateMeta: any) => { this.onLifestyleDateSelectExtention(event, dateMeta); });
    this.oneRepMaxCalendarOnDateSelectHandler = this.oneRepMaxCalendar.onDateSelect;
    this.oneRepMaxCalendar.onDateSelect = ((event: any, dateMeta: any) => { this.onOneRepMaxDateSelectExtention(event, dateMeta); });
    this.bodyCompCalendarOnDateSelectHandler = this.bodyCompCalendar.onDateSelect;
    this.bodyCompCalendar.onDateSelect = ((event: any, dateMeta: any) => { this.onBodyCompDateSelectExtention(event, dateMeta); });
  }

  public onLifestyleDateSelectExtention(event: any, dateMeta: any): void {
    this.lifestyleCalendarOnDateSelectHandler.call(this.lifestyleCalendar, event, dateMeta);
    if (this.lifestyleCalendar.value[1]) {
      this.lifestyleCalendar.overlayVisible = false;
      this.lifestyleCalendar.onClose.emit();
    }
  }

  public onOneRepMaxDateSelectExtention(event: any, dateMeta: any): void {
    this.oneRepMaxCalendarOnDateSelectHandler.call(this.oneRepMaxCalendar, event, dateMeta);
    if (this.oneRepMaxCalendar.value[1]) {
      this.oneRepMaxCalendar.overlayVisible = false;
      this.oneRepMaxCalendar.onClose.emit();
    }
  }

  public onBodyCompDateSelectExtention(event: any, dateMeta: any): void {
    this.bodyCompCalendarOnDateSelectHandler.call(this.bodyCompCalendar, event, dateMeta);
    if (this.bodyCompCalendar.value[1]) {
      this.bodyCompCalendar.overlayVisible = false;
      this.bodyCompCalendar.onClose.emit();
    }
  }

  ngOnDestroy() {
    if (this.trainerMovementsSubscription) this.trainerMovementsSubscription.unsubscribe();
    if (this.standardMovementsSubscription) this.standardMovementsSubscription.unsubscribe();
  }

  public initializeDates(): void {
    this.today = new Date();
    this.today = new Date(this.today.toDateString());
    this.lifestyleDateRange = [this.addDays(-14, this.today), this.today];
    this.oneRepMaxDateRange = [this.addDays(-60, this.today), this.today];
    this.bodyCompDateRange = [this.addDays(-60, this.today), this.today];
  }

  public initializeUser(): void {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      if (this.user.type == 'trainer') {
        this.subjectUser = this.userService.getActiveClient();
        this.titleText = 'Progress - ' + this.subjectUser.nameFirst + ' ' + this.subjectUser.nameLast;
      } else {
        this.subjectUser = this.userService.getActiveUser();
        this.titleText = 'Progress';
      }
    }
  }

  public loadWorkoutData(): void {
    this.workoutService.getWorkoutHeaders(this.subjectUser.id, this.addDays(-7, this.today), this.today).subscribe((workouts: Workout[]) => {
      this.sevenDaySummary = this.calculateWorkoutSummary(workouts);
    });
    this.workoutService.getWorkoutHeaders(this.subjectUser.id, this.addDays(-30, this.today), this.today).subscribe((workouts: Workout[]) => {
      this.thirtyDaySummary = this.calculateWorkoutSummary(workouts);
    });
  }

  public calculateWorkoutSummary(workouts: Workout[]): WorkoutSummary {
    let summary = {
      inPersonScheduled: 0,
      inPersonCompleted: 0,
      inPersonSuccessRate: '',
      remoteScheduled: 0,
      remoteCompleted: 0,
      remoteSuccessRate: ''
    };
    for (let i = 0; i < workouts.length; i++) {
      if (workouts[i].meetingType == 'inperson') {
        summary.inPersonScheduled++;
        if (workouts[i].status == 'complete') summary.inPersonCompleted++;
      } else {
        summary.remoteScheduled++;
        if (workouts[i].status == 'complete') summary.remoteCompleted++;
      }
    }
    if (summary.inPersonScheduled > 0) {
      summary.inPersonSuccessRate = Math.round(summary.inPersonCompleted / summary.inPersonScheduled * 100).toString() + '%';
    } else {
      summary.inPersonSuccessRate = 'n/a'
    }
    if (summary.remoteScheduled > 0) {
      summary.remoteSuccessRate = Math.round(summary.remoteCompleted / summary.remoteScheduled * 100).toString() + '%';
    } else {
      summary.remoteSuccessRate = 'n/a'
    }
    return summary;
  }

  public loadMovementLibrary(): void {
    this.standardMovementsSubscription = this.workoutService.getStandardMovements().subscribe(standardMovements => {
      this.movementLibrary = standardMovements;
      this.trainerMovementsSubscription = this.workoutService.getTrainerMovements((this.subjectUser.type == 'trainer' ? this.subjectUser.id : this.subjectUser.trainerID)).subscribe(trainerMovements => {
        this.movementLibrary = this.movementLibrary.concat(trainerMovements);
        this.movementLibrary.sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < this.movementLibrary.length; i++) {
          if (this.movementLibrary[i].id == this.subjectUser.oneRepMaxMovementID) this.movementSelection = this.movementLibrary[i];
          this.loadOneRepMaxData();
        }
      });
    });
  }

  public loadLifestyleData(): void {
    this.lifestyleService.getSurveys(this.subjectUser.id, this.lifestyleDateRange[0], this.addDays(1, this.lifestyleDateRange[1])).subscribe((surveys: Survey[]) => {
      this.lifestyleChartData = {
        datasets: [
          {
            label: 'Sleep',
            data: this.formatSleepData(surveys),
            yAxisID: 'y-axis-rating',
            fill: false,
            borderColor: '#00FF00'
          },
          {
            label: 'Nutrition',
            data: this.formatNutritionData(surveys),
            yAxisID: 'y-axis-rating',
            fill: false,
            borderColor: '#00FFFF'
          },
          {
            label: 'Hydration',
            data: this.formatHydrationData(surveys),
            yAxisID: 'y-axis-rating',
            fill: false,
            borderColor: '#0000FF'
          },
          {
            label: 'Movement',
            data: this.formatMovementData(surveys),
            yAxisID: 'y-axis-rating',
            fill: false,
            borderColor: '#FF00FF'
          },
          {
            label: 'Stress',
            data: this.formatStressData(surveys),
            yAxisID: 'y-axis-rating',
            fill: false,
            borderColor: '#FF0000'
          },
          {
            label: 'Walking',
            data: this.formatWalkingData(surveys),
            yAxisID: 'y-axis-minutes',
            fill: false,
            borderColor: '#006400'
          }
        ]
      };
    });
  }

  public formatSleepData(surveys: Survey[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < surveys.length; i++) {
      data.push({t: surveys[i].date, y: surveys[i].sleepRating});
    }
    return data;
  }

  public formatNutritionData(surveys: Survey[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < surveys.length; i++) {
      data.push({t: surveys[i].date, y: surveys[i].nutritionRating});
    }
    return data;
  }

  public formatHydrationData(surveys: Survey[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < surveys.length; i++) {
      data.push({t: surveys[i].date, y: surveys[i].hydrationRating});
    }
    return data;
  }

  public formatMovementData(surveys: Survey[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < surveys.length; i++) {
      data.push({t: surveys[i].date, y: surveys[i].movementRating});
    }
    return data;
  }

  public formatStressData(surveys: Survey[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < surveys.length; i++) {
      data.push({t: surveys[i].date, y: surveys[i].stressLevel});
    }
    return data;
  }

  public formatWalkingData(surveys: Survey[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < surveys.length; i++) {
      data.push({t: surveys[i].date, y: surveys[i].minutesWalking});
    }
    return data;
  }

  public loadLifestyleChartOptions(): void {
    this.lifestyleChartOptions = {
      legend: {
        display: false
      }, 
      scales: {
        xAxes: [{
          type: 'time', 
          time: {
            unit: 'day'
          }, 
          distribution: 'linear', 
          ticks: {
            source: 'auto'
          }
        }], 
        yAxes: [{
          id: 'y-axis-rating',
          type: 'linear',
          position: 'left',
          display: true,
          ticks: {
            min: 1,
            max: 5
          }
        }, {
          id: 'y-axis-minutes',
          type: 'linear',
          position: 'right',
          display: false,
          ticks: {
            min: 0,
            max: 62
          }
        }]
      }
    };
  }

  public loadOneRepMaxData(): void {
    if (this.movementSelection) {
      this.workoutService.getUserMovementHistoryForPeriod(this.subjectUser.id, this.movementSelection.id, this.oneRepMaxDateRange[0], this.oneRepMaxDateRange[1]).subscribe((userMovements: UserMovementHistory[]) => {
        for (let i = 0; i < userMovements.length; i++) {
          userMovements[i].oneRepMax = this.workoutService.calculateOneRepMax(userMovements[i]);
        }
        this.oneRepMaxChartData = {
          datasets: [
            {
              label: this.movementSelection.name,
              data: this.formatOneRepMaxData(userMovements),
              fill: false,
              borderColor: '#0000FF'
            }
          ]
        };
      });
    }
  }

  public formatOneRepMaxData(userMovements: UserMovementHistory[]): any[] {
    let data: any[] = [];
    for (let i = 0; i < userMovements.length; i++) {
      data.push({t: userMovements[i].date, y: userMovements[i].oneRepMax});
    }
    return data;
  }

  public loadOneRepMaxChartOptions(): void {
    this.oneRepMaxChartOptions = {
      legend: {
        display: false
      }, 
      scales: {
        xAxes: [{
          type: 'time', 
          time: {
            unit: 'day'
          }, 
          distribution: 'linear', 
          ticks: {
            source: 'data'
          }
        }]
      }
    };
  }

  public loadBodyCompData(): void {
    this.progressService.getBodyCompMeasurements(this.subjectUser.id, this.bodyCompDateRange[0], this.bodyCompDateRange[1]).subscribe(retArray => {
      this.bodyCompMeasurements = retArray;
      for (let i = 0; i < this.bodyCompMeasurements.length; i++) {
        this.convertFirestoreTimestampsToDates(this.bodyCompMeasurements[i]);
      }
      this.bodyCompChartData = {
        datasets: [
          {
            label: 'Weight',
            data: this.formatWeightData(),
            yAxisID: 'y-axis-weight',
            fill: false,
            borderColor: '#0000FF'
          },
          {
            label: 'Body Fat',
            data: this.formatBodyFatData(),
            yAxisID: 'y-axis-bodyfat',
            fill: false,
            borderColor: '#00FF00'
          },
          {
            label: 'Waist',
            data: this.formatWaistData(),
            yAxisID: 'y-axis-waist',
            fill: false,
            borderColor: '#FF0000'
          }
        ]
      };
      this.loadProgressPics();
    });
  }

  public loadProgressPics(): void {
    for (let i = 0; i < this.bodyCompMeasurements.length; i++) {
      this.bodyCompMeasurements[i].picUrl = this.afStorage.ref('user/progress/' + this.subjectUser.id + '/' + this.bodyCompMeasurements[i].progressPic).getDownloadURL();
    }
    if (this.bodyCompMeasurements.length > 0) {
      this.leftPicIndex = 0;
      this.rightPicIndex = this.bodyCompMeasurements.length - 1;
    }
  }

  public onClickLeftPicDecrement(): void {
    if (this.leftPicIndex > 0) this.leftPicIndex--;
  }

  public onClickLeftPicIncrement(): void {
    if (this.leftPicIndex < this.bodyCompMeasurements.length - 1) this.leftPicIndex++;
  }

  public onClickRightPicDecrement(): void {
    if (this.rightPicIndex > 0) this.rightPicIndex--;
  }

  public onClickRightPicIncrement(): void {
    if (this.rightPicIndex < this.bodyCompMeasurements.length - 1) this.rightPicIndex++;
  }

  public formatWeightData(): any[] {
    let data: any[] = [];
    for (let i = 0; i < this.bodyCompMeasurements.length; i++) {
      data.push({t: this.bodyCompMeasurements[i].date, y: this.bodyCompMeasurements[i].weight});
    }
    return data;
  }

  public formatBodyFatData(): any[] {
    let data: any[] = [];
    for (let i = 0; i < this.bodyCompMeasurements.length; i++) {
      data.push({t: this.bodyCompMeasurements[i].date, y: this.bodyCompMeasurements[i].abdominalFat});
    }
    return data;
  }

  public formatWaistData(): any[] {
    let data: any[] = [];
    for (let i = 0; i < this.bodyCompMeasurements.length; i++) {
      data.push({t: this.bodyCompMeasurements[i].date, y: this.bodyCompMeasurements[i].waistCircumference});
    }
    return data;
  }

  public loadBodyCompChartOptions(): void {
    this.bodyCompChartOptions = {
      legend: {
        display: false
      }, 
      scales: {
        xAxes: [{
          type: 'time', 
          time: {
            unit: 'day'
          }, 
          distribution: 'linear', 
          ticks: {
            source: 'data'
          }
        }],
        yAxes: [{
          id: 'y-axis-weight',
          type: 'linear',
          position: 'left'
        }, {
          id: 'y-axis-bodyfat',
          type: 'linear',
          position: 'right',
          display: false
        }, {
          id: 'y-axis-waist',
          type: 'linear',
          position: 'right',
          display: false
        }]
      }
    };
  }

  public onLifestyleDateRangeSelected(): void {
    // Reload chart data
    this.loadLifestyleData();
  }

  public onMovementSelected(): void {
    // Reload chart data
    this.loadOneRepMaxData();
    // Save user preference
    this.subjectUser.oneRepMaxMovementID = this.movementSelection.id;
    this.userService.updateUser(this.subjectUser);
  }

  public onOneRepMaxDateRangeSelected(): void {
    // Reload chart data
    this.loadOneRepMaxData();
  }

  public onBodyCompDateRangeSelected(): void {
    // Reload chart data
    this.loadBodyCompData();
  }
  
  public searchMovements(event): void {
    let valueEntered: string = event.query;
    let values: string[] = valueEntered.split(' ');
    let movementSuggestions: Movement[] = [];
    for (let i = 0; i < this.movementLibrary.length; i++) {
      let matchCount = 0;
      for (let j = 0; j < values.length; j++) {
        if (this.movementLibrary[i].name.toLowerCase().indexOf(values[j].toLowerCase()) >= 0) matchCount++;
      }
      if (matchCount == values.length) movementSuggestions.push(this.movementLibrary[i]);
    }
    this.movementSuggestions = movementSuggestions;
  }

  public addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
  }

  public formatDate(date: Date): string {
    const options = {weekday: 'short', month: 'short', day: 'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

  public formatPicDate(date: Date): string {
    const options = {month: 'short', day: 'numeric', year: 'numeric'};
    return date.toLocaleDateString('en-US', options);
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
