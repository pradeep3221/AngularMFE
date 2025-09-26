import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mfe1-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h2>Dashboard Microfrontend (MFE1)</h2>
      <p>This is the actual dashboard component loaded from MFE1.</p>
      
      <div class="dashboard-grid">
        <div class="metric-card">
          <h3>Total Users</h3>
          <div class="metric-value">1,234</div>
          <div class="metric-change positive">+12% from last month</div>
        </div>
        
        <div class="metric-card">
          <h3>Active Sessions</h3>
          <div class="metric-value">567</div>
          <div class="metric-change positive">+8% from last month</div>
        </div>
        
        <div class="metric-card">
          <h3>Revenue</h3>
          <div class="metric-value">$12,345</div>
          <div class="metric-change positive">+15% from last month</div>
        </div>
        
        <div class="metric-card">
          <h3>Conversion Rate</h3>
          <div class="metric-value">3.2%</div>
          <div class="metric-change negative">-2% from last month</div>
        </div>
      </div>
      
      <div class="charts-section">
        <div class="chart-placeholder">
          <h4>Revenue Chart</h4>
          <div class="chart-mock">📊 Chart would be here</div>
        </div>
        
        <div class="chart-placeholder">
          <h4>User Activity</h4>
          <div class="chart-mock">📈 Chart would be here</div>
        </div>
      </div>
      
      <div class="recent-activity">
        <h4>Recent Activity</h4>
        <ul>
          <li>New user registration: john@example.com</li>
          <li>Payment processed: $299.99</li>
          <li>Support ticket created: #12345</li>
          <li>User updated profile: jane@example.com</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #007bff;
    }
    
    .metric-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #333;
      margin: 10px 0;
    }
    
    .metric-change {
      font-size: 12px;
      font-weight: 500;
    }
    
    .metric-change.positive {
      color: #28a745;
    }
    
    .metric-change.negative {
      color: #dc3545;
    }
    
    .charts-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    
    .chart-placeholder {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .chart-placeholder h4 {
      margin: 0 0 20px 0;
      color: #333;
    }
    
    .chart-mock {
      height: 200px;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #6c757d;
    }
    
    .recent-activity {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    
    .recent-activity h4 {
      margin: 0 0 15px 0;
      color: #333;
    }
    
    .recent-activity ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .recent-activity li {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      color: #666;
    }
    
    .recent-activity li:last-child {
      border-bottom: none;
    }
  `]
})
export class DashboardComponent {
}
