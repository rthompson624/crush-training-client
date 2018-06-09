import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from '../message.service';
import { Observable } from 'rxjs';
import { Message } from '../message.model';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.css']
})
export class MessageListComponent implements OnInit, AfterViewChecked {
  public user: User;
  public fromUserID: string;
  public toUserID: string;
  public clientID: string;
  public messages: Observable<Message[]>;
  public newMessage: Message;
  public afterViewCheckCount: number = 0;

  constructor(
    private router: Router, 
    private messageService: MessageService, 
    private userService: UserService
  ) { }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.fromUserID = this.user.id;
      if (this.user.type == 'client') {
        this.toUserID = this.user.trainerID;
        this.clientID = this.user.id;
      } else if (this.user.type == 'trainer') {
        this.toUserID = this.userService.getActiveClient().id;
        this.clientID = this.toUserID;
      } else {
        console.log('MessageList::ngOnInit() - User type not recognized (' + this.user.type + ').');
      }
      this.messages = this.messageService.getMessages(this.clientID, this.user.id);
      this.newMessage = new Message(null, null, null, this.fromUserID, this.toUserID, false, this.clientID);
    }
  }

  ngAfterViewChecked() {
    // The following is to scroll the screen to the bottom upon page load and new message creation. 10 times seems to be the threshold.
    if (this.afterViewCheckCount < 20) {
      window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
      this.afterViewCheckCount++;
    }
  }

  public onSendMessage(): void {
    this.newMessage.date = new Date();
    this.messageService.addMessage(this.newMessage);
    this.newMessage.messageText = '';
    this.afterViewCheckCount = 0;
  }

  public formatMultiline(value: string): string {
    return value.replace(/[\n\r]/g, '<br>');
  }

}
