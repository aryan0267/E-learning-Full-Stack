// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { InstructorAnnouncementsCreateComponent } from './instructor-announcements-create.component';

// describe('InstructorAnnouncementsCreateComponent', () => {
//   let component: InstructorAnnouncementsCreateComponent;
//   let fixture: ComponentFixture<InstructorAnnouncementsCreateComponent>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       declarations: [InstructorAnnouncementsCreateComponent]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(InstructorAnnouncementsCreateComponent);
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

import { InstructorAnnouncementsCreateComponent } from './instructor-announcements-create.component';
import { CourseService } from '../../../services/course.service';
import { AnnouncementService } from '../../../services/announcement.service';
import { EnrollmentService } from '../../../services/enrollment.service';
import { NotificationService } from '../../../services/notification.service';
import { Announcement } from '../../../models/announcement';
import { Notification } from '../../../models/notification';

describe('InstructorAnnouncementsCreateComponent', () => {
  let fixture: ComponentFixture<InstructorAnnouncementsCreateComponent>;
  let component: InstructorAnnouncementsCreateComponent;

  let courseSpy: jasmine.SpyObj<CourseService>;
  let annSpy: jasmine.SpyObj<AnnouncementService>;
  let enrollSpy: jasmine.SpyObj<EnrollmentService>;
  let notifSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    courseSpy = jasmine.createSpyObj('CourseService', ['getCoursesByInstructor']);
    annSpy = jasmine.createSpyObj('AnnouncementService', ['createAnnouncement']);
    enrollSpy = jasmine.createSpyObj('EnrollmentService', ['getEnrollmentsByCourse']);
    notifSpy = jasmine.createSpyObj('NotificationService', ['createNotification']);

    // default localStorage user id
    spyOn(localStorage, 'getItem').and.callFake((k: string) => k === 'user' ? JSON.stringify({ id: 10 }) : null);

    TestBed.configureTestingModule({
      declarations: [InstructorAnnouncementsCreateComponent],
      providers: [
        { provide: CourseService, useValue: courseSpy },
        { provide: AnnouncementService, useValue: annSpy },
        { provide: EnrollmentService, useValue: enrollSpy },
        { provide: NotificationService, useValue: notifSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorAnnouncementsCreateComponent);
    component = fixture.componentInstance;

    // silence alerts and console errors during tests
    spyOn(window, 'alert');
    spyOn(console, 'error');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should set instructorId and load courses when user exists', () => {
    const mockCourses = [{ id: 1, name: 'C1' }];
    // cast to any to satisfy the Course[] expected type in the spy return
    courseSpy.getCoursesByInstructor.and.returnValue(of(mockCourses as any));

    fixture.detectChanges(); // triggers ngOnInit

    expect(component.instructorId).toBe(10);
    expect(courseSpy.getCoursesByInstructor).toHaveBeenCalledWith(10);
    expect(component.courses).toEqual(mockCourses);
  });

  it('ngOnInit should log error and return when no instructor id in localStorage', () => {
    // override localStorage to return null user
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);

    const comp = TestBed.createComponent(InstructorAnnouncementsCreateComponent).componentInstance;
    spyOn(comp as any, 'ngOnInit').and.callThrough();
    comp.ngOnInit();

    expect(console.error).toHaveBeenCalled();
    // course service should not be called
    expect(courseSpy.getCoursesByInstructor).not.toHaveBeenCalled();
  });

  it('create() should alert when fields missing', () => {
    component.model = { courseId: undefined, title: '', message: '' };
    component.create();
    expect(window.alert).toHaveBeenCalledWith('Please fill all fields');
    expect(annSpy.createAnnouncement).not.toHaveBeenCalled();
  });

  it('create() should publish announcement, notify enrollments and reset model on success', () => {
    // prepare model
    component.instructorId = 10;
    component.model = { courseId: 5, title: '  Hello  ', message: '  Body  ' };
    // spies
    annSpy.createAnnouncement.and.returnValue(of({} as Announcement));
    const enrolls = [{ studentId: 100 }, { studentId: 101 }];
    enrollSpy.getEnrollmentsByCourse.and.returnValue(of(enrolls as any));
    // return a Notification-shaped object so the Observable type matches the app model
    notifSpy.createNotification.and.returnValue(of({
      id: 0,
      userId: 100,
      type: 'announcement',
      message: 'New announcement',
      createdAt: new Date().toISOString(),
      read: false
    } as Notification));
    notifSpy.createNotification.and.returnValue(of({} as unknown as Notification));

    component.create();

    expect(annSpy.createAnnouncement).toHaveBeenCalled();
    const calledPayload = annSpy.createAnnouncement.calls.mostRecent().args[0] as Announcement;
    expect(calledPayload.courseId).toBe(5);
    expect(calledPayload.instructorId).toBe(10);
    expect(calledPayload.title).toBe('Hello');
    expect(calledPayload.message).toBe('Body');
    expect(enrollSpy.getEnrollmentsByCourse).toHaveBeenCalledWith(5);
    // notifications created for each enrollment
    expect(notifSpy.createNotification).toHaveBeenCalledTimes(2);
    expect(window.alert).toHaveBeenCalledWith('Announcement published.');
    expect(component.model.title).toBe('');
    expect(component.model.message).toBe('');
    expect(component.model.courseId).toBeUndefined();
  });

    it('create() should handle create error and alert failure', () => {
      component.instructorId = 10;
      component.model = { courseId: 5, title: 'T', message: 'M' };
  
      annSpy.createAnnouncement.and.returnValue(throwError(() => new Error('fail')));
  
      component.create();
  
      expect(annSpy.createAnnouncement).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Failed to publish announcement.');
    });
  
  });
  
