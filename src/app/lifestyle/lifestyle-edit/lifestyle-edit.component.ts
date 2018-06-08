import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { LifestyleService } from '../lifestyle.service';
import { Survey } from '../survey.model';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { PanelModule } from 'primeng/panel';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-lifestyle-edit',
  templateUrl: './lifestyle-edit.component.html',
  styleUrls: ['./lifestyle-edit.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class LifestyleEditComponent implements OnInit {
  public user: User;
  public survey: Survey;
  public displayIncompleteDialog: boolean = false;

  constructor(private router: Router, private lifestyleService: LifestyleService, private userService: UserService) { }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.survey = this.lifestyleService.getActiveSurvey(this.user.id);
      if (!this.survey.stressLevel) this.survey.stressLevel = 0;
    }
  }

  public submitQuestionnaire(): void {
    if (this.formComplete()) {
      this.survey.status = 'complete';
      this.survey.submittedDate = new Date();
      this.survey.trainerID = this.user.trainerID;
      this.lifestyleService.saveSurvey(this.survey);
      this.router.navigate(['/', 'dashboard']);
    } else {
      this.displayIncompleteDialog = true;
    }
  }

  public formComplete(): boolean {
    let isFormComplete = true;
    if (!this.survey.sleepRating) isFormComplete = false;
    if (!this.survey.nutritionRating) isFormComplete = false;
    if (!this.survey.hydrationRating) isFormComplete = false;
    if (!this.survey.movementRating) isFormComplete = false;
    if (!this.survey.stressLevel) isFormComplete = false;
    if (!this.survey.minutesWalking) isFormComplete = false;
    return isFormComplete;
  }

  public formatDate(date: Date): string {
    const options = {weekday:'long', month:'long', day:'numeric'};
    return date.toLocaleDateString('en-US', options);
  }
  
}
