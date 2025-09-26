import { TestBed } from '@angular/core/testing';
import { EventBusService, EventBusMessage } from './event-bus.service';

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventBusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit and receive events', (done) => {
    const testEvent = { type: 'test', payload: { data: 'test data' } };
    
    service.on('test').subscribe((event: EventBusMessage) => {
      expect(event.type).toBe('test');
      expect(event.payload.data).toBe('test data');
      done();
    });

    service.emit('test', { data: 'test data' });
  });

  it('should filter events by type', (done) => {
    let receivedEvents = 0;

    service.on('specific-event').subscribe(() => {
      receivedEvents++;
    });

    service.emit('specific-event', {});
    service.emit('other-event', {});
    service.emit('specific-event', {});

    setTimeout(() => {
      expect(receivedEvents).toBe(2);
      done();
    }, 100);
  });

  it('should filter events by source', (done) => {
    let receivedEvents = 0;

    service.onFromSource('mfe1').subscribe(() => {
      receivedEvents++;
    });

    service.emit('event1', {}, 'mfe1');
    service.emit('event2', {}, 'mfe2');
    service.emit('event3', {}, 'mfe1');

    setTimeout(() => {
      expect(receivedEvents).toBe(2);
      done();
    }, 100);
  });
});
