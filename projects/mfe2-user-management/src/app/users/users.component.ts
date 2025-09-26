import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mfe2-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="users-container">
      <h2>User Management Microfrontend (MFE2)</h2>
      <p>This is the actual user management component loaded from MFE2.</p>
      
      <div class="toolbar">
        <div class="search-box">
          <input type="text" placeholder="Search users..." />
          <button class="search-btn">🔍</button>
        </div>
        <div class="actions">
          <button class="btn btn-primary">Add User</button>
          <button class="btn btn-secondary">Import</button>
          <button class="btn btn-secondary">Export</button>
        </div>
      </div>
      
      <div class="user-stats">
        <div class="stat-card">
          <div class="stat-number">1,234</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">567</div>
          <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">89</div>
          <div class="stat-label">New This Month</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">12</div>
          <div class="stat-label">Pending Approval</div>
        </div>
      </div>
      
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><div class="avatar">JD</div></td>
              <td>John Doe</td>
              <td>john.doe@example.com</td>
              <td><span class="role admin">Admin</span></td>
              <td><span class="status active">Active</span></td>
              <td>2 hours ago</td>
              <td>
                <button class="action-btn edit">✏️</button>
                <button class="action-btn delete">🗑️</button>
              </td>
            </tr>
            <tr>
              <td><div class="avatar">JS</div></td>
              <td>Jane Smith</td>
              <td>jane.smith@example.com</td>
              <td><span class="role user">User</span></td>
              <td><span class="status active">Active</span></td>
              <td>1 day ago</td>
              <td>
                <button class="action-btn edit">✏️</button>
                <button class="action-btn delete">🗑️</button>
              </td>
            </tr>
            <tr>
              <td><div class="avatar">BJ</div></td>
              <td>Bob Johnson</td>
              <td>bob.johnson@example.com</td>
              <td><span class="role user">User</span></td>
              <td><span class="status inactive">Inactive</span></td>
              <td>1 week ago</td>
              <td>
                <button class="action-btn edit">✏️</button>
                <button class="action-btn delete">🗑️</button>
              </td>
            </tr>
            <tr>
              <td><div class="avatar">AS</div></td>
              <td>Alice Wilson</td>
              <td>alice.wilson@example.com</td>
              <td><span class="role moderator">Moderator</span></td>
              <td><span class="status active">Active</span></td>
              <td>3 hours ago</td>
              <td>
                <button class="action-btn edit">✏️</button>
                <button class="action-btn delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination">
        <button class="page-btn">Previous</button>
        <span class="page-info">Page 1 of 10</span>
        <button class="page-btn">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0;
      gap: 20px;
    }
    
    .search-box {
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .search-box input {
      border: none;
      padding: 10px 15px;
      outline: none;
      min-width: 300px;
    }
    
    .search-btn {
      background: #f8f9fa;
      border: none;
      padding: 10px 15px;
      cursor: pointer;
      border-left: 1px solid #ddd;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .user-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #007bff;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    
    .users-table {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      margin: 20px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    }
    
    .role {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .role.admin {
      background: #dc3545;
      color: white;
    }
    
    .role.user {
      background: #28a745;
      color: white;
    }
    
    .role.moderator {
      background: #ffc107;
      color: #333;
    }
    
    .status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status.active {
      background: #d4edda;
      color: #155724;
    }
    
    .status.inactive {
      background: #f8d7da;
      color: #721c24;
    }
    
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      margin: 0 2px;
      border-radius: 3px;
    }
    
    .action-btn:hover {
      background: #f8f9fa;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin: 20px 0;
    }
    
    .page-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .page-btn:hover {
      background: #f8f9fa;
    }
    
    .page-info {
      color: #666;
    }
  `]
})
export class UsersComponent {
}
