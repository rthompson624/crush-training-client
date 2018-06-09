import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-check-version',
  templateUrl: './check-version.component.html',
  styleUrls: ['./check-version.component.css']
})
export class CheckVersionComponent implements OnInit, OnDestroy {
  public operatingVersion: string = environment.appVersion;
  public newVersionAvailable: boolean = false;
  public appInfoSubscription: Subscription;

  constructor(private afs: AngularFirestore) {
    afs.firestore.settings({timestampsInSnapshots: true});
  }

  ngOnInit() {
    this.appInfoSubscription = this.afs.doc('appInfo/crush-training').valueChanges().subscribe(appInfo => {
      const currentVersion: string = appInfo['currentVersion'] as string;
      if (this.convertVersionToNumber(currentVersion) > this.convertVersionToNumber(this.operatingVersion)) this.newVersionAvailable = true;
    });
  }

  ngOnDestroy() {
    if (this.appInfoSubscription) this.appInfoSubscription.unsubscribe();
  }

  public convertVersionToNumber(version: string): number {
    // Expected format: ##.##.##
    const aryVersion: string[] = version.split('.');
    let versionNumber: number = 0;
    if (aryVersion.length == 3) {
      versionNumber = parseInt(aryVersion[0]) + (parseInt(aryVersion[1]) / 100) + (parseInt(aryVersion[2]) / 10000);
    }
    return versionNumber;
  }

  public reloadApp(): void {
    window.location.reload();
  }

}
