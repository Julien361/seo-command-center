import { OverviewStats, SitesList, QuickWinsTable, PositionChart, RecentActivity } from '../components/dashboard';
import WorkflowStatus from '../components/workflows/WorkflowStatus';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <OverviewStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PositionChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SitesList />
        <WorkflowStatus />
      </div>

      <QuickWinsTable />
    </div>
  );
}
