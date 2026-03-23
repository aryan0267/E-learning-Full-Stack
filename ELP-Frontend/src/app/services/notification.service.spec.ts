// import { TestBed } from '@angular/core/testing';

// import { NotificationService } from './notification.service';

// describe('NotificationService', () => {
//   let service: NotificationService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(NotificationService);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });


import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { NotificationService } from './notification.service';
import { ApiService } from './api.service';
import { Notification } from '../models/notification';

describe('NotificationService', () => {
  let service: NotificationService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getNotificationsForUser should call api.get with proper params and return notifications', (done) => {
    const mock: Notification[] = [{ id: 1, title: 't', body: 'b', read: false } as unknown as Notification];
    apiSpy.get.and.returnValue(of(mock));

    service.getNotificationsForUser(5).subscribe(res => {
      expect(res).toBe(mock);
      expect(apiSpy.get).toHaveBeenCalledWith('notifications', { userId: 5, _sort: 'createdAt', _order: 'desc' });
      done();
    });
  });

  it('getNotificationsForUser should propagate errors from api.get', (done) => {
    const err = new Error('network');
    apiSpy.get.and.returnValue(throwError(() => err));

    service.getNotificationsForUser(1).subscribe({
      next: () => fail('expected error'),
      error: e => {
        expect(e).toBe(err);
        done();
      }
    });
  });

  it('getUnreadCount should call api.get on unread-count endpoint and return a number', (done) => {
    apiSpy.get.and.returnValue(of(7));
    service.getUnreadCount(10).subscribe(count => {
      expect(count).toBe(7);
      expect(apiSpy.get).toHaveBeenCalledWith('notifications/unread-count', { userId: 10 });
      done();
    });
  });

  it('createNotification should call api.post and return created notification', (done) => {
    const payload: Notification = { id: 0, title: 'New', body: 'x', read: false } as unknown as Notification;
    const created = { ...payload, id: 123 };
    apiSpy.post.and.returnValue(of(created));

    service.createNotification(payload).subscribe(res => {
      expect(res).toEqual(created);
      expect(apiSpy.post).toHaveBeenCalledWith('notifications', payload);
      done();
    });
  });

  it('markAsRead should call api.put on the read endpoint', (done) => {
    apiSpy.put.and.returnValue(of({}));
    service.markAsRead(22).subscribe(res => {
      expect(apiSpy.put).toHaveBeenCalledWith('notifications/22/read', {});
      done();
    });
  });

    it('markAsRead should work with string id as well', (done) => {
      apiSpy.put.and.returnValue(of({}));
      service.markAsRead('abc').subscribe(() => {
        expect(apiSpy.put).toHaveBeenCalledWith('notifications/abc/read', {});
        done();
      });
    });
  });