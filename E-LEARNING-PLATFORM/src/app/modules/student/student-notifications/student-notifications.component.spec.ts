// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { StudentNotificationsComponent } from './student-notifications.component';

// describe('StudentNotificationsComponent', () => {
//   let component: StudentNotificationsComponent;
//   let fixture: ComponentFixture<StudentNotificationsComponent>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       declarations: [StudentNotificationsComponent]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(StudentNotificationsComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { StudentNotificationsComponent } from './student-notifications.component';
import { NotificationService } from '../../../services/notification.service';
import { StudentContextService } from '../../../services/student-context.service';
import { Notification } from '../../../models/notification';

describe('StudentNotificationsComponent', () => {
  let fixture: ComponentFixture<StudentNotificationsComponent>;
  let component: StudentNotificationsComponent;

  // Stubs / spies
  const routeStub: any = {
    snapshot: {
      queryParamMap: {
        get: (k: string) => null
      }
    }
  };

  let nsSpy: jasmine.SpyObj<NotificationService>;
  let ctxSpy: jasmine.SpyObj<StudentContextService>;

  beforeEach(async () => {
    nsSpy = jasmine.createSpyObj('NotificationService', ['getNotificationsForUser', 'markAsRead']);
    // default returns empty array observable
    nsSpy.getNotificationsForUser.and.returnValue(of([]));
    nsSpy.markAsRead.and.returnValue(of({}));

    ctxSpy = jasmine.createSpyObj('StudentContextService', ['getStudentId', 'setStudentId']);
    ctxSpy.getStudentId.and.returnValue(null);

    await TestBed.configureTestingModule({
      declarations: [StudentNotificationsComponent],
      providers: [
        { provide: NotificationService, useValue: nsSpy },
        { provide: StudentContextService, useValue: ctxSpy },
        { provide: ActivatedRoute, useValue: routeStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentNotificationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should prefer query param studentId when present and set context', () => {
    // arrange: set query param to '42'
    routeStub.snapshot.queryParamMap.get = (_: string) => '42';
    nsSpy.getNotificationsForUser.and.returnValue(of([]));

    // act
    fixture.detectChanges(); // triggers ngOnInit -> load

    // assert
    expect(component.userId).toBe(42);
    expect(ctxSpy.setStudentId).toHaveBeenCalledWith(42);
    expect(nsSpy.getNotificationsForUser).toHaveBeenCalledWith(42);
  });

  it('should fallback to context studentId when query param is not valid', () => {
    // arrange: no query param, context provides id 7
    routeStub.snapshot.queryParamMap.get = (_: string) => null;
    ctxSpy.getStudentId.and.returnValue(7);
    nsSpy.getNotificationsForUser.and.returnValue(of([{ id: 1, title: 't', body: 'b', read: false } as unknown as Notification]));

    // act
    fixture.detectChanges();

    // assert
    expect(component.userId).toBe(7);
    expect(ctxSpy.setStudentId).toHaveBeenCalledWith(7);
    expect(component.notifications.length).toBe(1);
    expect(nsSpy.getNotificationsForUser).toHaveBeenCalledWith(7);
  });

  it('should fallback to localStorage user id when query param and context are null', () => {
    // arrange: ensure context null and query param null
    routeStub.snapshot.queryParamMap.get = (_: string) => null;
    ctxSpy.getStudentId.and.returnValue(null);

    // set localStorage user
    const user = { id: 99, name: 'Alice' };
    spyOn(localStorage, 'getItem').and.callFake((k: string) => k === 'user' ? JSON.stringify(user) : null);
    nsSpy.getNotificationsForUser.and.returnValue(of([]));

    // act
    fixture.detectChanges();

    // assert
    expect(component.userId).toBe(99);
    expect(ctxSpy.setStudentId).toHaveBeenCalledWith(99);
    expect(nsSpy.getNotificationsForUser).toHaveBeenCalledWith(99);
  });

  it('load() should populate notifications on success', () => {
    // arrange
    component.userId = 5;
    const payload: Notification[] = [
      { id: 11, title: 'A', body: 'B', read: false } as unknown as Notification
    ];
    nsSpy.getNotificationsForUser.and.returnValue(of(payload));

    // act
    component.load();

    // assert
    expect(nsSpy.getNotificationsForUser).toHaveBeenCalledWith(5);
    expect(component.notifications).toEqual(payload);
  });

  it('load() should handle error and set notifications to empty', () => {
    // arrange
    component.userId = 6;
    nsSpy.getNotificationsForUser.and.returnValue(throwError(() => new Error('fail')));
    spyOn(console, 'error');

    // act
    component.load();

    // assert
    expect(nsSpy.getNotificationsForUser).toHaveBeenCalledWith(6);
    expect(component.notifications).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('markRead should call service and mark notification read when id present', () => {
    // arrange
    const n = { id: 22, title: 'x', body: 'y', read: false } as unknown as Notification;
    nsSpy.markAsRead.and.returnValue(of({}));

    // act
    component.markRead(n);

    // assert
    expect(nsSpy.markAsRead).toHaveBeenCalledWith(22);
    // markAsRead subscription is synchronous with of(), so read should be true
    expect(n.read).toBeTrue();
  });

    it('markRead should not call service when id is falsy', () => {
      const n = { id: 0, title: 'no', body: '', read: false } as unknown as Notification;
      component.markRead(n);
      expect(nsSpy.markAsRead).not.toHaveBeenCalled();
      expect(n.read).toBeFalse();
    });
  
  });