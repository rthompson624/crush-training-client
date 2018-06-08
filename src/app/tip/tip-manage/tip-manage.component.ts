import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { Tip } from '../tip.model';
import { TipService } from '../tip.service';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-tip-manage',
  templateUrl: './tip-manage.component.html',
  styleUrls: ['./tip-manage.component.css']
})

export class TipManageComponent implements OnInit, OnDestroy {
  public user: User;
  public tips: Tip[];
  public tipsSubscription: Subscription;
  public activeTip: Tip;
  public saveDisabled: boolean = true;

  constructor(private router: Router, private userService: UserService, private tipService: TipService) { }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.tipsSubscription = this.tipService.getAllTips(this.user.id).subscribe(tips => this.tips = tips);
      this.activeTip = new Tip(null);
      this.activeTip.trainerID = this.user.id;
    }
  }

  ngOnDestroy() {
    if (this.tipsSubscription) this.tipsSubscription.unsubscribe();
  }

  public validateForm(): void {
    if ((this.activeTip.startDate) && (this.activeTip.tipText)) {
      this.saveDisabled = false;
    } else {
      this.saveDisabled = true;
    }
  }

  public saveTip(): void {
    if (this.activeTip.id) {
      this.tipService.updateTip(this.activeTip);
    } else {
      this.tipService.addTip(this.activeTip);
    }
    this.resetTip();
    this.saveDisabled = true;
  }

  public resetTip(): void {
    this.activeTip.id = null;
    this.activeTip.startDate = null;
    this.activeTip.tipText = null;
  }

  public onEditTip(tip: Tip): void {
    this.activeTip.id = tip.id;
    this.activeTip.startDate = tip.startDate;
    this.activeTip.tipText = tip.tipText;
  }

  public onDeleteTip(tip: Tip): void {
    this.tipService.deleteTip(tip);
  }

  public reseedTips(): void {
    let dateCounter = new Date();
    dateCounter = new Date(dateCounter.toDateString());    
    for (let i = this.tips.length - 1; i >= 0; i--) {
      this.tipService.updateTipDate(this.tips[i].id, dateCounter);
      dateCounter = this.addDays(1, dateCounter);
    }
  }

  public addDays(days: number, date: Date): Date {
    let dateCopy = new Date(date);
    dateCopy.setDate(dateCopy.getDate() + days);
    return dateCopy;
  }

  public formatDate(date: Date): string {
    return '' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }
  
}
