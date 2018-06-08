import { Injectable, EventEmitter, Output } from '@angular/core';

@Injectable()
export class NavigationStateService {
  public fromRoute: string;
  public toAction: string;
  public createOnDate: Date;
  public createWithMeetingType: string;
  public calendarView: string = 'all-clients';
  private userType: string;
  private userStatus: string;
  @Output() userTypeUpdated: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  public setUserType(type: string): void {
    this.userType = type;
    this.userTypeUpdated.emit(type);
  }

  public getUserType(): string {
    return this.userType;
  }

}
