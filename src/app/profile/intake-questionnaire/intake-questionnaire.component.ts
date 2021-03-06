import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.model';
import { Validators, FormControl, FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SliderModule } from 'primeng/slider';
import { CalendarModule } from 'primeng/calendar';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-intake-questionnaire',
  templateUrl: './intake-questionnaire.component.html',
  styleUrls: ['./intake-questionnaire.component.css']
})

export class IntakeQuestionnaireComponent implements OnInit, OnDestroy {
  public user: User;
  public userform: FormGroup;
  public genderOptions: SelectItem[];
  public stateOptions: SelectItem[];
  public countryOptions: SelectItem[];
  public activeUserSubscription: Subscription;

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    this.activeUserSubscription = this.userService.activeUserUpdated.subscribe((user: User) => {this.user = user});
    this.userform = this.fb.group({
      'city': new FormControl('', Validators.required),
      'state': new FormControl(''),
      'country': new FormControl('', Validators.required),
      'phone': new FormControl('', Validators.required),
      'birthday': new FormControl('', Validators.required),
      'gender': new FormControl('', Validators.required),
      'height': new FormControl('', Validators.required),
      'weight': new FormControl('', Validators.required),
      'profession': new FormControl('', Validators.required),
      'outcome': new FormControl('', Validators.required),
      'outcomeReason': new FormControl('', Validators.required),
      'medical': new FormControl('', Validators.required),
      'medicalDesc': new FormControl(''),
      'injury': new FormControl('', Validators.required),
      'injuryDesc': new FormControl('',),
      'stressLevel': new FormControl('', Validators.required),
      'hoursSleep': new FormControl('', Validators.required),
      'minutesWalk': new FormControl('', Validators.required),
      'water': new FormControl('', Validators.required),
      'breakfast': new FormControl('', Validators.required),
      'lunch': new FormControl('', Validators.required),
      'dinner': new FormControl('', Validators.required),
      'snacks': new FormControl('')
    });
  }

  ngOnDestroy() {
    if (this.activeUserSubscription) this.activeUserSubscription.unsubscribe();
  }

  public onSubmit(): void {
    this.saveToDatabase();
    this.updateUserInfo();
    this.router.navigate(['/', 'dashboard']);
  }

  public onSubmitClick(): void {
    if (!this.userform.valid) {
      for (let i in this.userform.controls) {
        this.userform.controls[i].markAsDirty();
      }
    }
  }

  public updateUserInfo(): void {
    this.user.city = this.userform.controls['city'].value;
    this.user.country = this.userform.controls['country'].value;
    if (this.user.country == 'United States') {
      this.user.state = this.userform.controls['state'].value;
    } else {
      this.user.state = null;
    }
    this.user.phone = this.userform.controls['phone'].value;
    this.user.birthday = this.userform.controls['birthday'].value;
    this.user.gender = this.userform.controls['gender'].value;
    this.user.height = this.convertHeightToInches(this.userform.controls['height'].value);
    this.user.initialWeight = this.userform.controls['weight'].value;
    this.user.weight = this.userform.controls['weight'].value;
    this.user.outcome = this.userform.controls['outcome'].value;
    this.user.outcomeReason = this.userform.controls['outcomeReason'].value;
    this.userService.updateUser(this.user);
  }

  public saveToDatabase(): void {
    let state: string;
    if (this.userform.controls['country'].value == 'United States') {
      state = this.userform.controls['state'].value;
    } else {
      state = null;
    }
    this.afs.collection('intake-questionnaire').add({
      userID: this.user.id,
      date: new Date(),
      city: this.userform.controls['city'].value,
      state: state,
      country: this.userform.controls['country'].value,
      phone: this.userform.controls['phone'].value,
      birthday: this.userform.controls['birthday'].value,
      gender: this.userform.controls['gender'].value,
      height: this.convertHeightToInches(this.userform.controls['height'].value),
      weight: this.userform.controls['weight'].value,
      profession: this.userform.controls['profession'].value,
      outcome: this.userform.controls['outcome'].value,
      outcomeReason: this.userform.controls['outcomeReason'].value,
      medical: this.userform.controls['medical'].value,
      medicalDesc: this.userform.controls['medicalDesc'].value,
      injury: this.userform.controls['injury'].value,
      injuryDesc: this.userform.controls['injuryDesc'].value,
      stressLevel: this.userform.controls['stressLevel'].value,
      hoursSleep: this.userform.controls['hoursSleep'].value,
      minutesWalk: this.userform.controls['minutesWalk'].value,
      water: this.userform.controls['water'].value,
      breakfast: this.userform.controls['breakfast'].value,
      lunch: this.userform.controls['lunch'].value,
      dinner: this.userform.controls['dinner'].value,
      snacks: this.userform.controls['snacks'].value,
      coachNotes: null
    });
  }

  public convertHeightToInches(heightString: string): number {
    heightString = heightString.replace('_', '');
    let ary = heightString.split('-');
    let heightInches: number = (Number(ary[0]) * 12) + Number(ary[1]);
    return heightInches;
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

  constructor(private userService: UserService, private fb: FormBuilder, private afs: AngularFirestore, private router: Router) { 
    afs.firestore.settings({timestampsInSnapshots: true});
    this.genderOptions = [
      {label: 'Male', value: 'male'},
      {label: 'Female', value: 'female'}
    ];
    this.stateOptions = [
      {label: '', value: null}, 
      {label: 'Alabama', value: 'AL'}, 
      {label: 'Alaska', value: 'AK'}, 
      {label: 'Arizona', value: 'AZ'}, 
      {label: 'Arkansas', value: 'AR'}, 
      {label: 'California', value: 'CA'}, 
      {label: 'Colorado', value: 'CO'}, 
      {label: 'Connecticut', value: 'CT'}, 
      {label: 'Delaware', value: 'DE'}, 
      {label: 'Florida', value: 'FL'}, 
      {label: 'Georgia', value: 'GA'}, 
      {label: 'Hawaii', value: 'HI'}, 
      {label: 'Idaho', value: 'ID'}, 
      {label: 'Illinois', value: 'IL'}, 
      {label: 'Indiana', value: 'IN'}, 
      {label: 'Iowa', value: 'IA'}, 
      {label: 'Kansas', value: 'KS'}, 
      {label: 'Kentucky', value: 'KY'}, 
      {label: 'Louisiana', value: 'LA'}, 
      {label: 'Maine', value: 'ME'}, 
      {label: 'Maryland', value: 'MD'}, 
      {label: 'Massachusetts', value: 'MA'}, 
      {label: 'Michigan', value: 'MI'}, 
      {label: 'Minnesota', value: 'MN'}, 
      {label: 'Mississippi', value: 'MS'}, 
      {label: 'Missouri', value: 'MO'}, 
      {label: 'Montana', value: 'MT'}, 
      {label: 'Nebraska', value: 'NE'}, 
      {label: 'Nevada', value: 'NV'}, 
      {label: 'New Hampshire', value: 'NH'}, 
      {label: 'New Jersey', value: 'NJ'}, 
      {label: 'New Mexico', value: 'NM'}, 
      {label: 'New York', value: 'NY'}, 
      {label: 'North Carolina', value: 'NC'}, 
      {label: 'North Dakota', value: 'ND'}, 
      {label: 'Ohio', value: 'OH'}, 
      {label: 'Oklahoma', value: 'OK'}, 
      {label: 'Oregon', value: 'OR'}, 
      {label: 'Pennsylvania', value: 'PA'}, 
      {label: 'Rhode Island', value: 'RI'}, 
      {label: 'South Carolina', value: 'SC'}, 
      {label: 'South Dakota', value: 'SD'}, 
      {label: 'Tennessee', value: 'TN'}, 
      {label: 'Texas', value: 'TX'}, 
      {label: 'Utah', value: 'UT'}, 
      {label: 'Vermont', value: 'VT'}, 
      {label: 'Virginia', value: 'VA'}, 
      {label: 'Washington', value: 'WA'}, 
      {label: 'West Virginia', value: 'WV'}, 
      {label: 'Wisconsin', value: 'WI'}, 
      {label: 'Wyoming', value: 'WY'}, 
      {label: 'Puerto Rico', value: 'PR'}
    ];
    this.countryOptions = [
      {label: 'United States', value: 'United States'},
      {label: 'Afghanistan', value: 'Afghanistan'},
      {label: 'Albania', value: 'Albania'},
      {label: 'Algeria', value: 'Algeria'},
      {label: 'American Samoa', value: 'American Samoa'},
      {label: 'Andorra', value: 'Andorra'},
      {label: 'Angola', value: 'Angola'},
      {label: 'Anguilla', value: 'Anguilla'},
      {label: 'Antigua and Barbuda', value: 'Antigua and Barbuda'},
      {label: 'Argentina', value: 'Argentina'},
      {label: 'Armenia', value: 'Armenia'},
      {label: 'Aruba', value: 'Aruba'},
      {label: 'Australia', value: 'Australia'},
      {label: 'Austria', value: 'Austria'},
      {label: 'Azerbaijan', value: 'Azerbaijan'},
      {label: 'Bahamas', value: 'Bahamas'},
      {label: 'Bahrain', value: 'Bahrain'},
      {label: 'Bangladesh', value: 'Bangladesh'},
      {label: 'Barbados', value: 'Barbados'},
      {label: 'Belarus', value: 'Belarus'},
      {label: 'Belgium', value: 'Belgium'},
      {label: 'Belize', value: 'Belize'},
      {label: 'Benin', value: 'Benin'},
      {label: 'Bermuda', value: 'Bermuda'},
      {label: 'Bhutan', value: 'Bhutan'},
      {label: 'Bolivia', value: 'Bolivia'},
      {label: 'Bosnia and Herzegovina', value: 'Bosnia and Herzegovina'},
      {label: 'Botswana', value: 'Botswana'},
      {label: 'Brazil', value: 'Brazil'},
      {label: 'British Virgin Islands', value: 'British Virgin Islands'},
      {label: 'Brunei', value: 'Brunei'},
      {label: 'Bulgaria', value: 'Bulgaria'},
      {label: 'Burkina Faso', value: 'Burkina Faso'},
      {label: 'Burundi', value: 'Burundi'},
      {label: 'Côte d\'Ivoire', value: 'Côte d\'Ivoire'},
      {label: 'Cabo Verde', value: 'Cabo Verde'},
      {label: 'Cambodia', value: 'Cambodia'},
      {label: 'Cameroon', value: 'Cameroon'},
      {label: 'Canada', value: 'Canada'},
      {label: 'Caribbean Netherlands', value: 'Caribbean Netherlands'},
      {label: 'Cayman Islands', value: 'Cayman Islands'},
      {label: 'Central African Republic', value: 'Central African Republic'},
      {label: 'Chad', value: 'Chad'},
      {label: 'Channel Islands', value: 'Channel Islands'},
      {label: 'Chile', value: 'Chile'},
      {label: 'China', value: 'China'},
      {label: 'Colombia', value: 'Colombia'},
      {label: 'Comoros', value: 'Comoros'},
      {label: 'Congo (Congo-Brazzaville)', value: 'Congo (Congo-Brazzaville)'},
      {label: 'Cook Islands', value: 'Cook Islands'},
      {label: 'Costa Rica', value: 'Costa Rica'},
      {label: 'Croatia', value: 'Croatia'},
      {label: 'Cuba', value: 'Cuba'},
      {label: 'Curaçao', value: 'Curaçao'},
      {label: 'Cyprus', value: 'Cyprus'},
      {label: 'Czech Republic', value: 'Czech Republic'},
      {label: 'Democratic Republic of the Congo', value: 'Democratic Republic of the Congo'},
      {label: 'Denmark', value: 'Denmark'},
      {label: 'Djibouti', value: 'Djibouti'},
      {label: 'Dominica', value: 'Dominica'},
      {label: 'Dominican Republic', value: 'Dominican Republic'},
      {label: 'Ecuador', value: 'Ecuador'},
      {label: 'Egypt', value: 'Egypt'},
      {label: 'El Salvador', value: 'El Salvador'},
      {label: 'Equatorial Guinea', value: 'Equatorial Guinea'},
      {label: 'Eritrea', value: 'Eritrea'},
      {label: 'Estonia', value: 'Estonia'},
      {label: 'Ethiopia', value: 'Ethiopia'},
      {label: 'Faeroe Islands', value: 'Faeroe Islands'},
      {label: 'Falkland Islands (Islas Malvinas)', value: 'Falkland Islands (Islas Malvinas)'},
      {label: 'Fiji', value: 'Fiji'},
      {label: 'Finland', value: 'Finland'},
      {label: 'France', value: 'France'},
      {label: 'French Guiana', value: 'French Guiana'},
      {label: 'French Polynesia', value: 'French Polynesia'},
      {label: 'Gabon', value: 'Gabon'},
      {label: 'Gambia', value: 'Gambia'},
      {label: 'Georgia', value: 'Georgia'},
      {label: 'Germany', value: 'Germany'},
      {label: 'Ghana', value: 'Ghana'},
      {label: 'Gibraltar', value: 'Gibraltar'},
      {label: 'Greece', value: 'Greece'},
      {label: 'Greenland', value: 'Greenland'},
      {label: 'Grenada', value: 'Grenada'},
      {label: 'Guadeloupe', value: 'Guadeloupe'},
      {label: 'Guam', value: 'Guam'},
      {label: 'Guatemala', value: 'Guatemala'},
      {label: 'Guinea', value: 'Guinea'},
      {label: 'Guinea-Bissau', value: 'Guinea-Bissau'},
      {label: 'Guyana', value: 'Guyana'},
      {label: 'Haiti', value: 'Haiti'},
      {label: 'Holy See', value: 'Holy See'},
      {label: 'Honduras', value: 'Honduras'},
      {label: 'Hong Kong (S.A.R. of China)', value: 'Hong Kong (S.A.R. of China)'},
      {label: 'Hungary', value: 'Hungary'},
      {label: 'Iceland', value: 'Iceland'},
      {label: 'India', value: 'India'},
      {label: 'Indonesia', value: 'Indonesia'},
      {label: 'Iran', value: 'Iran'},
      {label: 'Iraq', value: 'Iraq'},
      {label: 'Ireland', value: 'Ireland'},
      {label: 'Isle of Man', value: 'Isle of Man'},
      {label: 'Israel', value: 'Israel'},
      {label: 'Italy', value: 'Italy'},
      {label: 'Jamaica', value: 'Jamaica'},
      {label: 'Japan', value: 'Japan'},
      {label: 'Jordan', value: 'Jordan'},
      {label: 'Kazakhstan', value: 'Kazakhstan'},
      {label: 'Kenya', value: 'Kenya'},
      {label: 'Kiribati', value: 'Kiribati'},
      {label: 'Kuwait', value: 'Kuwait'},
      {label: 'Kyrgyzstan', value: 'Kyrgyzstan'},
      {label: 'Laos', value: 'Laos'},
      {label: 'Latvia', value: 'Latvia'},
      {label: 'Lebanon', value: 'Lebanon'},
      {label: 'Lesotho', value: 'Lesotho'},
      {label: 'Liberia', value: 'Liberia'},
      {label: 'Libya', value: 'Libya'},
      {label: 'Liechtenstein', value: 'Liechtenstein'},
      {label: 'Lithuania', value: 'Lithuania'},
      {label: 'Luxembourg', value: 'Luxembourg'},
      {label: 'Macao (S.A.R. of China)', value: 'Macao (S.A.R. of China)'},
      {label: 'Macedonia (FYROM)', value: 'Macedonia (FYROM)'},
      {label: 'Madagascar', value: 'Madagascar'},
      {label: 'Malawi', value: 'Malawi'},
      {label: 'Malaysia', value: 'Malaysia'},
      {label: 'Maldives', value: 'Maldives'},
      {label: 'Mali', value: 'Mali'},
      {label: 'Malta', value: 'Malta'},
      {label: 'Marshall Islands', value: 'Marshall Islands'},
      {label: 'Martinique', value: 'Martinique'},
      {label: 'Mauritania', value: 'Mauritania'},
      {label: 'Mauritius', value: 'Mauritius'},
      {label: 'Mayotte', value: 'Mayotte'},
      {label: 'Mexico', value: 'Mexico'},
      {label: 'Micronesia', value: 'Micronesia'},
      {label: 'Moldova', value: 'Moldova'},
      {label: 'Monaco', value: 'Monaco'},
      {label: 'Mongolia', value: 'Mongolia'},
      {label: 'Montenegro', value: 'Montenegro'},
      {label: 'Montserrat', value: 'Montserrat'},
      {label: 'Morocco', value: 'Morocco'},
      {label: 'Mozambique', value: 'Mozambique'},
      {label: 'Myanmar (formerly Burma)', value: 'Myanmar (formerly Burma)'},
      {label: 'Namibia', value: 'Namibia'},
      {label: 'Nauru', value: 'Nauru'},
      {label: 'Nepal', value: 'Nepal'},
      {label: 'Netherlands', value: 'Netherlands'},
      {label: 'New Caledonia', value: 'New Caledonia'},
      {label: 'New Zealand', value: 'New Zealand'},
      {label: 'Nicaragua', value: 'Nicaragua'},
      {label: 'Niger', value: 'Niger'},
      {label: 'Nigeria', value: 'Nigeria'},
      {label: 'Niue', value: 'Niue'},
      {label: 'North Korea', value: 'North Korea'},
      {label: 'Northern Mariana Islands', value: 'Northern Mariana Islands'},
      {label: 'Norway', value: 'Norway'},
      {label: 'Oman', value: 'Oman'},
      {label: 'Pakistan', value: 'Pakistan'},
      {label: 'Palau', value: 'Palau'},
      {label: 'Palestine State', value: 'Palestine State'},
      {label: 'Panama', value: 'Panama'},
      {label: 'Papua New Guinea', value: 'Papua New Guinea'},
      {label: 'Paraguay', value: 'Paraguay'},
      {label: 'Peru', value: 'Peru'},
      {label: 'Philippines', value: 'Philippines'},
      {label: 'Poland', value: 'Poland'},
      {label: 'Portugal', value: 'Portugal'},
      {label: 'Puerto Rico', value: 'Puerto Rico'},
      {label: 'Qatar', value: 'Qatar'},
      {label: 'Réunion', value: 'Réunion'},
      {label: 'Romania', value: 'Romania'},
      {label: 'Russia', value: 'Russia'},
      {label: 'Rwanda', value: 'Rwanda'},
      {label: 'Saint Helena', value: 'Saint Helena'},
      {label: 'Saint Kitts and Nevis', value: 'Saint Kitts and Nevis'},
      {label: 'Saint Lucia', value: 'Saint Lucia'},
      {label: 'Saint Pierre and Miquelon', value: 'Saint Pierre and Miquelon'},
      {label: 'Saint Vincent and the Grenadines', value: 'Saint Vincent and the Grenadines'},
      {label: 'Samoa', value: 'Samoa'},
      {label: 'San Marino', value: 'San Marino'},
      {label: 'Sao Tome and Principe', value: 'Sao Tome and Principe'},
      {label: 'Saudi Arabia', value: 'Saudi Arabia'},
      {label: 'Senegal', value: 'Senegal'},
      {label: 'Serbia', value: 'Serbia'},
      {label: 'Seychelles', value: 'Seychelles'},
      {label: 'Sierra Leone', value: 'Sierra Leone'},
      {label: 'Singapore', value: 'Singapore'},
      {label: 'Sint Maarten', value: 'Sint Maarten'},
      {label: 'Slovakia', value: 'Slovakia'},
      {label: 'Slovenia', value: 'Slovenia'},
      {label: 'Solomon Islands', value: 'Solomon Islands'},
      {label: 'Somalia', value: 'Somalia'},
      {label: 'South Africa', value: 'South Africa'},
      {label: 'South Korea', value: 'South Korea'},
      {label: 'South Sudan', value: 'South Sudan'},
      {label: 'Spain', value: 'Spain'},
      {label: 'Sri Lanka', value: 'Sri Lanka'},
      {label: 'Sudan', value: 'Sudan'},
      {label: 'Suriname', value: 'Suriname'},
      {label: 'Swaziland', value: 'Swaziland'},
      {label: 'Sweden', value: 'Sweden'},
      {label: 'Switzerland', value: 'Switzerland'},
      {label: 'Syria', value: 'Syria'},
      {label: 'Taiwan', value: 'Taiwan'},
      {label: 'Tajikistan', value: 'Tajikistan'},
      {label: 'Tanzania', value: 'Tanzania'},
      {label: 'Thailand', value: 'Thailand'},
      {label: 'Timor-Leste', value: 'Timor-Leste'},
      {label: 'Togo', value: 'Togo'},
      {label: 'Tokelau', value: 'Tokelau'},
      {label: 'Tonga', value: 'Tonga'},
      {label: 'Trinidad and Tobago', value: 'Trinidad and Tobago'},
      {label: 'Tunisia', value: 'Tunisia'},
      {label: 'Turkey', value: 'Turkey'},
      {label: 'Turkmenistan', value: 'Turkmenistan'},
      {label: 'Turks and Caicos Islands', value: 'Turks and Caicos Islands'},
      {label: 'Tuvalu', value: 'Tuvalu'},
      {label: 'Uganda', value: 'Uganda'},
      {label: 'Ukraine', value: 'Ukraine'},
      {label: 'United Arab Emirates', value: 'United Arab Emirates'},
      {label: 'United Kingdom', value: 'United Kingdom'},
      {label: 'United States', value: 'United States'},
      {label: 'United States Virgin Islands', value: 'United States Virgin Islands'},
      {label: 'Uruguay', value: 'Uruguay'},
      {label: 'Uzbekistan', value: 'Uzbekistan'},
      {label: 'Vanuatu', value: 'Vanuatu'},
      {label: 'Venezuela', value: 'Venezuela'},
      {label: 'Viet Nam', value: 'Viet Nam'},
      {label: 'Wallis and Futuna Islands', value: 'Wallis and Futuna Islands'},
      {label: 'Western Sahara', value: 'Western Sahara'},
      {label: 'Yemen', value: 'Yemen'},
      {label: 'Zambia', value: 'Zambia'},
      {label: 'Zimbabwe', value: 'Zimbabwe'}
    ];
  }

}
