import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MenuManagement from './MenuManagement';
import TableManagement from './TableManagement';
import StaffManagement from './StaffManagement';
import Reports from './Reports';
import NotificationTester from './NotificationTester';
import { Card } from '@/components/ui/card';
import AdminNav from '@/components/layout/AdminNav';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('menu');
  const { user } = useAuth();

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'menu':
        return <MenuManagement />;
      case 'tables':
        return <TableManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return <NotificationTester />;
      default:
        return <MenuManagement />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <div className="container mx-auto px-4 py-4 flex-1">
        <Card className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-secondary">Admin Dashboard</h1>
          </div>

          {/* Admin Tabs */}
          <div className="mb-6">
            <div className="border-b border-neutral-200">
              <ul className="flex -mb-px flex-wrap" id="admin-tabs">
                <li className="mr-1">
                  <button 
                    className={`status-tab ${activeTab === 'menu' ? 'active' : ''}`}
                    onClick={() => setActiveTab('menu')}
                  >
                    Menu Management
                  </button>
                </li>
                <li className="mr-1">
                  <button 
                    className={`status-tab ${activeTab === 'tables' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tables')}
                  >
                    Tables & QR Codes
                  </button>
                </li>
                <li className="mr-1">
                  <button 
                    className={`status-tab ${activeTab === 'staff' ? 'active' : ''}`}
                    onClick={() => setActiveTab('staff')}
                  >
                    Staff Management
                  </button>
                </li>
                <li className="mr-1">
                  <button 
                    className={`status-tab ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    Reports
                  </button>
                </li>
                <li className="mr-1">
                  <button 
                    className={`status-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    Notification Tester
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </Card>
      </div>
    </div>
  );
}
