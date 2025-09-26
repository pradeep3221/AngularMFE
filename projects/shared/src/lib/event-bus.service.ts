import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface EventBusMessage {
  type: string;
  payload?: any;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<EventBusMessage>();

  constructor() { }

  // Emit an event
  emit(type: string, payload?: any, source?: string): void {
    this.eventSubject.next({ type, payload, source });
  }

  // Listen to specific event types
  on(eventType: string): Observable<EventBusMessage> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === eventType)
    );
  }

  // Listen to all events
  onAll(): Observable<EventBusMessage> {
    return this.eventSubject.asObservable();
  }

  // Listen to events from a specific source
  onFromSource(source: string): Observable<EventBusMessage> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.source === source)
    );
  }
}
