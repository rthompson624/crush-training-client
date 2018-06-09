// import * as firebase from 'firebase';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { environment } from '../../environments/environment';
import { EventEmitter, Output } from '@angular/core';

export class AuthService {
  @Output() userAuthenticationStatus: EventEmitter<string> = new EventEmitter<string>();

  public initializeService(): void {
    firebase.initializeApp(environment.firebase);
  }

  public signupUser(email: string, password: string) {
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  }

  public loginUser(email: string, password: string): Promise<any> {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  public logoutUser(): void {
    firebase.auth().signOut();
    this.userAuthenticationStatus.emit('logout');
  }

  public checkUserAuthenticationStatus(): void {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.userAuthenticationStatus.emit(user.uid);
      }
    });
  }

  public sendPasswordResetEmail(email: string): void {
    firebase.auth().sendPasswordResetEmail(email).then(response => {
      // Email sent
      console.log('AuthService::sendPasswordResetEmail() - email sent to ' + email);
    }).catch(error => {
      console.log('AuthService::sendPasswordResetEmail()');
      console.log(error);
    });
  }

}