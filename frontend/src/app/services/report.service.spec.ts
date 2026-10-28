import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportService } from './report.service';

describe('ReportService cash date ranges', () => {
  let service: ReportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  for (const hour of [0, 23]) {
    it(`sends local calendar dates for cash and employee sales at hour ${hour}`, () => {
      const start = new Date(2026, 9, 1, hour, 30);
      const end = new Date(2026, 9, 27, hour, 30);

      service.getCashRegisterByDateRange(start, end).subscribe();
      service.getUserSalesReport(undefined, start, end).subscribe();

      for (const endpoint of ['daily-cash-register', 'user-sales']) {
        const request = http.expectOne(req => req.url.endsWith(`/api/reports/${endpoint}`));
        expect(request.request.method).toBe('GET');
        expect(request.request.params.get('startDate')).toBe('2026-10-01');
        expect(request.request.params.get('endDate')).toBe('2026-10-27');
        expect(request.request.params.has('date')).toBeFalse();
        request.flush(endpoint === 'user-sales' ? [] : {});
      }
    });
  }

  it('supports a single inclusive day and preserves the daily report API', () => {
    const date = new Date(2000, 1, 29, 23, 30);
    service.getCashRegisterByDateRange(date, date).subscribe();
    const range = http.expectOne(req => req.url.endsWith('/daily-cash-register'));
    expect(range.request.params.get('startDate')).toBe('2000-02-29');
    expect(range.request.params.get('endDate')).toBe('2000-02-29');
    range.flush({});

    service.getDailyCashRegister(date).subscribe();
    const daily = http.expectOne(req => req.url.endsWith('/daily-cash-register'));
    expect(daily.request.params.get('date')).toBe('2000-02-29');
    daily.flush({});
  });
});
