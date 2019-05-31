import { Component, OnInit, AfterViewInit, Output } from '@angular/core';
import { TokenService } from 'src/app/services/token.service';
import { Router } from '@angular/router';
import * as M from 'materialize-css';
import { UsersService } from 'src/app/services/users.service';
import * as moment from 'moment';
import io from 'socket.io-client';
import _ from 'lodash';

import { MessageService } from 'src/app/services/message.service';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, AfterViewInit {
  @Output() onlineUsers = new EventEmitter();
  user: any;
  notifications = [];
  socket: any;
  count = [];
  chatList = [];
  msgNumber = 0;
  imageId: any;
  imageVersion: any;
  constructor(
    private tokenService: TokenService,
    private router: Router,
    private userService: UsersService,
    private msgService: MessageService
  ) {
    this.socket = io('http://localhost:3000');
  }

  ngOnInit() {
    this.user = this.tokenService.GetPayload();
    const dropDownElement = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropDownElement, {
      alignment: 'right',
      hover: true,
      coverTrigger: false
    });
    this.socket.emit('online', { room: 'global', user: this.user.username });

    const dropDownElementTwo = document.querySelectorAll('.dropdown-trigger1');
    M.Dropdown.init(dropDownElementTwo, {
      alignment: 'right',
      hover: true,
      coverTrigger: false
    });
    this.GetUser();
    this.socket.on('refreshPage', () => {
      this.GetUser();
    });
  }
  ngAfterViewInit() {
    this.socket.on('usersOnline', data => {
      this.onlineUsers.emit(data);
    });
  }

  logout() {
    this.tokenService.DeleteToken();
    this.router.navigate(['']);
  }
  GoToHome() {
    this.router.navigate(['streams']);
  }
  GoToChatPage(name) {
    this.router.navigate(['chat', name]);
    this.msgService.MarkMessages(this.user.username, name).subscribe(data => {
      console.log(data);
      this.socket.emit('refresh', {});
    });
  }
  MarkAllMessages() {
    this.msgService.MarkAllMessages().subscribe(data => {
      this.socket.emit('refresh', {});
      this.msgNumber = 0;
    });
  }
  GetUser() {
    this.userService.GetUserById(this.user._id).subscribe(
      data => {
        this.imageId = data.result.picId;
        this.imageVersion = data.result.picVersion;

        this.notifications = data.result.notifications.reverse();
        const value = _.filter(this.notifications, ['read', false]);
        this.count = value;
        this.chatList = data.result.chatList;
        this.CheckIfread(this.chatList);
      },
      err => {
        if (err.error.token == null) {
          this.tokenService.DeleteToken();
          this.router.navigate(['']);
        }
      }
    );
  }
  TimeFromNow(time) {
    return moment(time).fromNow();
  }
  MarkAll() {
    this.userService.MarkAllasRead().subscribe(data => {
      this.socket.emit('refresh', {});
    });
  }
  MessageDate(data) {
    return moment(data).calendar(null, {
      sameDay: '[Hoy]',
      lastDay: '[Ayer]',
      lastWeek: 'DD/MM/YYYY',
      sameElse: 'DD/MM/YYYY'
    });
  }
  CheckIfread(arr) {
    const checkarr = [];
    for (let i = 0; i < arr.length; i++) {
      const receiver = arr[i].msgId.message[arr[i].msgId.message.length - 1];
      if (this.router.url !== `/chat/${receiver.sendername}`) {
        if (receiver.isRead === false && receiver.receivername === this.user.username) {
          checkarr.push(1);
          this.msgNumber = _.sum(checkarr);
        }
      }
    }
  }
}
