import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireStorageModule } from 'angularfire2/storage';

import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DataListModule } from 'primeng/datalist';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { InputMaskModule } from 'primeng/inputmask';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AccordionModule } from 'primeng/accordion';
import { KeyFilterModule } from 'primeng/keyfilter';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipsModule } from 'primeng/chips';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ChartModule } from 'primeng/chart';
import { GalleriaModule } from 'primeng/galleria';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CheckboxModule } from 'primeng/checkbox';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WorkoutListComponent } from './workout/workout-list/workout-list.component';
import { WorkoutEditComponent } from './workout/workout-edit/workout-edit.component';
import { WorkoutService } from './workout/workout.service';
import { LifestyleEditComponent } from './lifestyle/lifestyle-edit/lifestyle-edit.component';
import { LifestyleService} from './lifestyle/lifestyle.service';
import { MessageListComponent } from './message/message-list/message-list.component';
import { MessageService } from './message/message.service';
import { environment } from './../environments/environment';
import { WorkoutCreateComponent } from './workout/workout-create/workout-create.component';
import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthService } from './auth/auth.service';
import { UserService } from './user/user.service';
import { ClientListComponent } from './user/client-list/client-list.component';
import { IntakeQuestionnaireComponent } from './profile/intake-questionnaire/intake-questionnaire.component';
import { TipService } from './tip/tip.service';
import { TipManageComponent } from './tip/tip-manage/tip-manage.component';
import { ProfileViewComponent } from './profile/profile-view/profile-view.component';
import { ProfileEditComponent } from './profile/profile-edit/profile-edit.component';
import { IntakeQuestionnaireViewComponent } from './profile/intake-questionnaire-view/intake-questionnaire-view.component';
import { DashboardTrainerComponent } from './dashboard-trainer/dashboard-trainer.component';
import { CalendarWeekComponent } from './calendar-week/calendar-week.component';
import { NavigationStateService } from './navigation/navigation-state.service';
import { ScheduleService } from './user/schedule.service';
import { MovementManageComponent } from './workout/movement-manage/movement-manage.component';
import { SignupTrainerComponent } from './auth/signup-trainer/signup-trainer.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ProgressComponent } from './progress/progress.component';
import { ProgressService } from './progress/progress.service';
import { BodyCompositionInputComponent } from './progress/body-composition-input/body-composition-input.component';
import { MakePaymentComponent } from './payments/make-payment/make-payment.component';
import { PaymentService } from './payments/payment.service';
import { SubscriptionEditComponent } from './payments/subscription-edit/subscription-edit.component';
import { CheckVersionComponent } from './check-version/check-version.component';

const appRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard-trainer', component: DashboardTrainerComponent },
  { path: 'lifestyle', component: LifestyleEditComponent },
  { path: 'workouts', component: WorkoutListComponent },
  { path: 'workouts/:id', component: WorkoutEditComponent },
  { path: 'trainer/workouts/create/:id', component: WorkoutCreateComponent },
  { path: 'messages', component: MessageListComponent },
  { path: 'clients', component: ClientListComponent },
  { path: 'calendar', component: CalendarWeekComponent },
  { path: 'tip', component: TipManageComponent },
  { path: 'movement', component: MovementManageComponent },
  { path: 'intake', component: IntakeQuestionnaireComponent },
  { path: 'intake/view', component: IntakeQuestionnaireViewComponent },
  { path: 'profile', component: ProfileViewComponent },
  { path: 'profile/edit', component: ProfileEditComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'signup-trainer', component: SignupTrainerComponent },
  { path: 'login', component: LoginComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'body-comp', component: BodyCompositionInputComponent },
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'payment', component: MakePaymentComponent },
  { path: 'subscription-edit', component: SubscriptionEditComponent }
]

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DashboardComponent,
    WorkoutListComponent,
    WorkoutEditComponent,
    LifestyleEditComponent,
    MessageListComponent,
    WorkoutCreateComponent,
    SignupComponent,
    LoginComponent,
    ClientListComponent,
    IntakeQuestionnaireComponent,
    TipManageComponent,
    ProfileViewComponent,
    ProfileEditComponent,
    IntakeQuestionnaireViewComponent,
    DashboardTrainerComponent,
    CalendarWeekComponent,
    MovementManageComponent,
    SignupTrainerComponent,
    ConfigurationComponent,
    ProgressComponent,
    BodyCompositionInputComponent,
    MakePaymentComponent,
    SubscriptionEditComponent,
    CheckVersionComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireStorageModule,
    CalendarModule,
    DialogModule,
    DataListModule,
    PanelModule,
    InputTextareaModule,
    ButtonModule,
    RatingModule,
    SliderModule,
    InputTextModule,
    DropdownModule,
    InputMaskModule,
    RadioButtonModule,
    ScrollPanelModule,
    ToggleButtonModule,
    AccordionModule,
    KeyFilterModule,
    AutoCompleteModule,
    ChipsModule,
    SelectButtonModule,
    ChartModule,
    GalleriaModule,
    InputSwitchModule,
    CheckboxModule
  ],
  providers: [WorkoutService, LifestyleService, MessageService, AuthService, UserService, TipService, NavigationStateService, ScheduleService, ProgressService, PaymentService],
  bootstrap: [AppComponent]
})
export class AppModule { }
