import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppState {
  theme: 'light' | 'dark';
  language: string;
  notifications: Notification[];
  globalData: any;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StateManagementService {
  private initialState: AppState = {
    theme: 'light',
    language: 'en',
    notifications: [],
    globalData: {}
  };

  private stateSubject = new BehaviorSubject<AppState>(this.initialState);

  constructor() {
    // Load state from localStorage if available
    this.loadStateFromStorage();
  }

  get state$(): Observable<AppState> {
    return this.stateSubject.asObservable();
  }

  get currentState(): AppState {
    return this.stateSubject.value;
  }

  updateState(partialState: Partial<AppState>): void {
    const newState = { ...this.currentState, ...partialState };
    this.stateSubject.next(newState);
    this.saveStateToStorage(newState);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateState({ theme });
  }

  setLanguage(language: string): void {
    this.updateState({ language });
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    const notifications = [...this.currentState.notifications, newNotification];
    this.updateState({ notifications });
  }

  removeNotification(id: string): void {
    const notifications = this.currentState.notifications.filter(n => n.id !== id);
    this.updateState({ notifications });
  }

  clearNotifications(): void {
    this.updateState({ notifications: [] });
  }

  setGlobalData(key: string, value: any): void {
    const globalData = { ...this.currentState.globalData, [key]: value };
    this.updateState({ globalData });
  }

  getGlobalData(key: string): any {
    return this.currentState.globalData[key];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private saveStateToStorage(state: AppState): void {
    try {
      localStorage.setItem('appState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  private loadStateFromStorage(): void {
    try {
      const storedState = localStorage.getItem('appState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        this.stateSubject.next({ ...this.initialState, ...parsedState });
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }
}
