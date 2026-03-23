// import { TestBed } from '@angular/core/testing';

// import { AnnouncementService } from './announcement.service';

// describe('AnnouncementService', () => {
//   let service: AnnouncementService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(AnnouncementService);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });


import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AnnouncementService } from './announcement.service';
import { ApiService } from './api.service';
import { Announcement } from '../models/announcement';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        AnnouncementService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    service = TestBed.inject(AnnouncementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAnnouncementsForCourse should call api.get with correct params and return announcements', (done) => {
    const mock: Announcement[] = [{ id: 1, title: 'A', body: 'B', courseId: 10, createdAt: '', instructorId: 0, message: '' } as Announcement];
    apiSpy.get.and.returnValue(of(mock));

    service.getAnnouncementsForCourse(10).subscribe(res => {
      expect(res).toBe(mock);
      expect(apiSpy.get).toHaveBeenCalledWith('announcements', { courseId: 10, _sort: 'createdAt', _order: 'desc' });
      done();
    });
  });

  it('getAnnouncementsForCourse should propagate errors from api.get', (done) => {
    const err = new Error('network');
    apiSpy.get.and.returnValue(throwError(() => err));

    service.getAnnouncementsForCourse('abc').subscribe({
      next: () => fail('expected error'),
      error: e => {
        expect(e).toBe(err);
        expect(apiSpy.get).toHaveBeenCalledWith('announcements', { courseId: 'abc', _sort: 'createdAt', _order: 'desc' });
        done();
      }
    });
  });

  it('getAllAnnouncements should call api.get without courseId and return announcements', (done) => {
    const mock: Announcement[] = [{ id: 2, title: 'X', body: 'Y', courseId: 0, createdAt: '', instructorId: 0, message: '' } as Announcement];
    apiSpy.get.and.returnValue(of(mock));

    service.getAllAnnouncements().subscribe(res => {
      expect(res).toBe(mock);
      expect(apiSpy.get).toHaveBeenCalledWith('announcements', { _sort: 'createdAt', _order: 'desc' });
      done();
    });
  });

    it('createAnnouncement should call api.post and return created announcement', (done) => {
      const payload: Announcement = { id: 0, title: 'New', body: 'z', courseId: 5, createdAt: '', instructorId: 0, message: '' } as Announcement;
      const created = { ...payload, id: 99 };
      apiSpy.post.and.returnValue(of(created));
  
      service.createAnnouncement(payload).subscribe(res => {
        expect(res).toEqual(created);
        expect(apiSpy.post).toHaveBeenCalledWith('announcements', payload);
        done();
      });
    });
  });