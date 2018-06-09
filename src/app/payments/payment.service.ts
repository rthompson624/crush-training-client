import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { DocumentReference } from '@firebase/firestore-types';
import { Payment } from './payment.model';
import { StripeSubscription } from './stripe-subscription.model';
import { UserService } from '../user/user.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class PaymentService {

  constructor(private afs: AngularFirestore, private userService: UserService) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  public submitPayment(payment: Payment): Promise<DocumentReference> {
    return this.afs.collection('payment/').add({
      userID: payment.userID, 
      date: payment.date, 
      plan: payment.plan, 
      price: payment.price, 
      token: payment.token, 
      chargeID: payment.chargeID, 
      chargeError: payment.chargeError
    });
  }

  public getPayment(id: string): Observable<Payment> {
    let paymentDoc: AngularFirestoreDocument<Payment>;
    paymentDoc = this.afs.doc('payment/' + id);
    return paymentDoc.valueChanges();
  }

  public getPaymentWithID(id: string): Observable<Payment> {
    let paymentDoc: AngularFirestoreDocument<Payment>;
    let payment: Observable<Payment>;
    paymentDoc = this.afs.doc('payment/' + id);
    payment = paymentDoc.snapshotChanges().pipe(map(
      changeDoc => {
        let data = changeDoc.payload.data() as Payment;
        data.id = changeDoc.payload.id;
        this.convertFirestoreTimestampsToDates(data);
        return data;
      }
    ));
    return payment;
  }

  public submitSubscription(subscription: StripeSubscription): Promise<DocumentReference> {
    return this.afs.collection('subscription/').add({
      userID: subscription.userID, 
      stripeCustomerID: subscription.stripeCustomerID, 
      date: subscription.date, 
      plan: subscription.plan, 
      stripePlanID: subscription.stripePlanID, 
      token: subscription.token, 
      stripeSubscriptionID: subscription.stripeSubscriptionID, 
      subscriptionError: subscription.subscriptionError, 
      cancelled: subscription.cancelled
    });
  }

  public getSubscription(id: string): Observable<StripeSubscription> {
    let subscriptionDoc: AngularFirestoreDocument<StripeSubscription>;
    subscriptionDoc = this.afs.doc('subscription/' + id);
    return subscriptionDoc.valueChanges();
  }

  public getTrainerSubscription(trainerID: string): Observable<StripeSubscription[]> {
    let subscriptionCol: AngularFirestoreCollection<StripeSubscription>;
    let subscriptionsObs: Observable<StripeSubscription[]>;
    subscriptionCol = this.afs.collection('subscription', ref => ref.where('userID', '==', trainerID).where('cancelled', '==', false));
    subscriptionsObs = subscriptionCol.snapshotChanges().pipe(map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as StripeSubscription;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    ));
    return subscriptionsObs;
  }

  public changeSubscriptionPlan(userID: string, plan: string, stripePlanID: string): void {
    let subscriptionCol: AngularFirestoreCollection<StripeSubscription>;
    let subscriptionsObs: Observable<StripeSubscription[]>;
    subscriptionCol = this.afs.collection('subscription', ref => ref.where('userID', '==', userID).where('cancelled', '==', false));
    subscriptionsObs = subscriptionCol.snapshotChanges().pipe(map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as StripeSubscription;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    ));
    let subscriptionsSub = subscriptionsObs.subscribe(subscriptions => {
      if (subscriptions.length > 0) {
        const subscription = subscriptions[0];
        this.afs.collection('subscription').doc(subscription.id).update({
          plan: plan, 
          stripePlanID: stripePlanID
        });
        this.afs.collection('user').doc(userID).update({
          plan: plan
        })
        .then((retVal: void) => {
          this.userService.reloadActiveUser();
        });
      }
      subscriptionsSub.unsubscribe();
    });
  }

  public cancelSubscription(userID: string): void {
    let subscriptionCol: AngularFirestoreCollection<StripeSubscription>;
    let subscriptionsObs: Observable<StripeSubscription[]>;
    subscriptionCol = this.afs.collection('subscription', ref => ref.where('userID', '==', userID).where('cancelled', '==', false));
    subscriptionsObs = subscriptionCol.snapshotChanges().pipe(map(
      changeCol => {
        return changeCol.map(
          change => {
            let data = change.payload.doc.data() as StripeSubscription;
            data.id = change.payload.doc.id;
            this.convertFirestoreTimestampsToDates(data);
            return data;
          }
        );
      }
    ));
    let subscriptionsSub = subscriptionsObs.subscribe(subscriptions => {
      if (subscriptions.length > 0) {
        const subscription = subscriptions[0];
        this.afs.collection('subscription').doc(subscription.id).update({
          cancelled: true
        });
      }
      subscriptionsSub.unsubscribe();
    });
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
