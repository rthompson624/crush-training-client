import { Component, OnInit, OnDestroy} from '@angular/core';
import * as firebase from 'firebase';
import { AngularFirestore } from 'angularfire2/firestore';
import { environment } from './../environments/environment';
import { AuthService } from '../app/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  
  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.initializeService();
  }

  ngOnDestroy() {
    this.authService.logoutUser();
  }

}
