import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { ADMIN_EVENT_ANALYTICS } from '../graphql/operations';
import { 
  AdminEventAnalyticsPayload, 
  AdminAnalyticsInput, 
  EventAnalyticsNode, 
  SortOrder 
} from '../types';

// KPI Card Component
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  trend?: string;
  subtitle?: React.ReactNode;
  isPrimary?: boolean;
}> = ({ label, value, trend, subtitle, isPrimary }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 font-inter">{label}</p>
    <div className="flex-1 flex flex-col justify-center">
      <p className={`text-3xl font-bold tracking-tight font-manrope mb-2 ${isPrimary ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </p>
      {trend && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold font-inter">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
    {subtitle && (
      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 text-[11px] text-slate-500 font-medium font-inter">
        {subtitle}
      </div>
    )}
  </div>
);

// Expandable Table Row
const CollapsibleRow: React.FC<{ node: EventAnalyticsNode }> = ({ node }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
        <td className="py-5 px-6">
          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
            <span className={`material-symbols-outlined text-lg leading-none transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>
        </td>
        <td className="py-5 px-4">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{node.title}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{node.organizer?.name}</span>
          </div>
        </td>
        <td className="py-5 px-4">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            node.status.toLowerCase() === 'published' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
            node.status.toLowerCase() === 'draft' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
            'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
          }`}>
            {node.status}
          </span>
        </td>
        <td className="py-5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 font-inter">
          {node.startDate 
            ? new Date(isNaN(Number(node.startDate)) ? node.startDate : Number(node.startDate)).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
            : 'TBD'}
        </td>
        <td className="py-5 px-4">
          <div className="flex flex-col gap-1.5 w-32">
            <div className="flex justify-between text-[11px] font-bold font-inter">
              <span className="text-slate-400">{node.ticketsSold} / {node.totalCapacity}</span>
              <span className="text-primary">{Math.round(node.fillRate * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${node.fillRate * 100}%` }}
              ></div>
            </div>
          </div>
        </td>
        <td className="py-5 px-4 font-bold text-slate-900 dark:text-slate-100 font-inter">${node.grossRevenue.toLocaleString()}</td>
        <td className="py-5 px-4">
          <div className="flex flex-col font-inter">
            <span className="font-black text-indigo-600 dark:text-indigo-400">${node.avgTicketPrice.toFixed(2)}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">avg / ticket</span>
          </div>
        </td>
        <td className="py-5 px-4">
          <div className="flex flex-col font-inter">
            <span className="font-bold text-slate-900 dark:text-slate-100">${node.netRevenue.toLocaleString()}</span>
            {node.refundedAmount > 0 && (
              <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">-${node.refundedAmount.toLocaleString()} Ref</span>
            )}
          </div>
        </td>
        <td className="py-5 px-4">
          <div className="flex items-center gap-3">
             <div className="flex flex-col w-20 gap-1.5">
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${node.checkInRate * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-slate-500 font-inter">
                  {Math.round(node.checkInRate * 100)}% Checked
                </span>
             </div>
          </div>
        </td>
        <td className="py-5 px-6 text-right">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <span className="material-symbols-outlined text-lg leading-none">more_horiz</span>
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50/30 dark:bg-slate-900/40">
          <td className="p-0" colSpan={10}>
            <div className="px-20 py-8 border-l-4 border-primary ml-6 my-4 bg-white dark:bg-slate-950 rounded-r-2xl shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-lg">local_activity</span>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">Detailed Ticket Inventory</h4>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800/50 font-inter font-bold uppercase tracking-widest">
                    <th className="pb-3 px-2">Tier Configuration</th>
                    <th className="pb-3 text-center">Unit Price</th>
                    <th className="pb-3 text-center">Allocation</th>
                    <th className="pb-3 text-center">Tickets Sold</th>
                    <th className="pb-3 text-right pr-4">Node Revenue</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-inter">
                  {node.ticketTypeBreakdown.map((tier) => (
                    <tr key={tier.typeId} className="border-b border-slate-50 dark:border-slate-800/20 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">{tier.name}</td>
                      <td className="py-4 text-center font-bold text-slate-500">${tier.price.toFixed(2)}</td>
                      <td className="py-4 text-center font-medium text-slate-400">{tier.capacity}</td>
                      <td className="py-4 text-center font-black text-primary">{tier.sold}</td>
                      <td className="py-4 text-right pr-4 font-black text-slate-900 dark:text-slate-100">${tier.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const AdminAnalyticsPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [sortByField, setSortByField] = useState('Date');

  const input = useMemo(() => {
    const statuses = statusFilter === 'All Status' ? undefined : [statusFilter.toUpperCase()];
    
    // Sort logic
    let sortBy = 'START_DATE';
    const sortOrder = SortOrder.DESC;
    if (sortByField === 'Revenue') sortBy = 'GROSS_REVENUE';
    if (sortByField === 'Tickets') sortBy = 'TICKETS_SOLD';

    // Date range logic
    let dateRange = undefined;
    const now = new Date();
    if (dateFilter === 'Last 30 Days') {
      const from = new Date();
      from.setDate(now.getDate() - 30);
      dateRange = { from: from.toISOString(), to: now.toISOString() };
    } else if (dateFilter === 'Last 90 Days') {
      const from = new Date();
      from.setDate(now.getDate() - 90);
      dateRange = { from: from.toISOString(), to: now.toISOString() };
    } else if (dateFilter === 'Year to Date') {
      const from = new Date(now.getFullYear(), 0, 1);
      dateRange = { from: from.toISOString(), to: now.toISOString() };
    } else if (dateFilter === 'All Time') {
      dateRange = undefined;
    }

    return {
      first: 20,
      statuses,
      sortBy,
      sortOrder,
      dateRange,
      // Map generic search to organizerId if it looks like an ID, otherwise we'd need a name search extension
      organizerId: searchInput.length > 20 ? searchInput : undefined, 
    } as AdminAnalyticsInput;
  }, [statusFilter, sortByField, dateFilter, searchInput]);

  const { data, loading, error } = useQuery<{ adminEventAnalytics: AdminEventAnalyticsPayload }>(
    ADMIN_EVENT_ANALYTICS,
    {
      variables: { input },
      fetchPolicy: 'cache-and-network'
    }
  );

  const analytics = data?.adminEventAnalytics;
  const summary = analytics?.platformSummary;
  const events = analytics?.events.nodes || [];

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary font-black">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-3xl m-8 border border-rose-100 dark:border-rose-500/20">
        <span className="material-symbols-outlined text-5xl mb-4">error</span>
        <h2 className="text-2xl font-black tracking-tight">Analytics Sync Failed</h2>
        <p className="text-sm font-bold opacity-80 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      <main className="px-10 py-10">
        <header className="mb-12">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
             <span className="w-10 h-[2px] bg-indigo-600 dark:bg-indigo-400"></span>
             Admin Insights
          </div>
          <h1 className="text-5xl font-black tracking-tighter font-manrope">Platform Analytics</h1>
          <p className="text-slate-400 mt-2 font-bold text-lg">Real-time performance metrics across EventPulse ecosystem.</p>
        </header>

        {/* Global KPI Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          <KpiCard 
            label="Total Revenue" 
            value={`$${summary?.totalGrossRevenue.toLocaleString()}`} 
            trend="+12.4%" 
            isPrimary 
          />
          <KpiCard 
            label="Total Events" 
            value={summary?.totalEvents || 0} 
            subtitle={
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> 
                  {summary?.totalPublishedEvents} Pub
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> 
                  {summary?.totalDraftEvents} Draft
                </span>
                {((summary?.totalEvents || 0) - ((summary?.totalPublishedEvents || 0) + (summary?.totalDraftEvents || 0)) > 0) && (
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> 
                    {(summary?.totalEvents || 0) - ((summary?.totalPublishedEvents || 0) + (summary?.totalDraftEvents || 0))} Other
                  </span>
                )}
              </div>
            }
          />
          <KpiCard 
            label="Tickets Sold" 
            value={(summary?.totalTicketsSold || 0).toLocaleString()} 
            subtitle={<p className="font-bold">Target: <span className="text-slate-900 dark:text-slate-100">30,000</span></p>}
          />
          <KpiCard 
            label="Total Attendees" 
            value={(summary?.totalAttendeesUnique || 0).toLocaleString()} 
            subtitle="Unique visitors"
          />
          <KpiCard 
            label="Check-in Rate" 
            value={`${Math.round((summary?.platformCheckInRate || 0) * 100)}%`} 
            subtitle={
              <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-50 dark:border-slate-800">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-out" 
                  style={{ width: `${(summary?.platformCheckInRate || 0) * 100}%` }}
                ></div>
              </div>
            }
          />
          <KpiCard 
            label="Avg Rev / Event" 
            value={`$${Math.round((summary?.totalGrossRevenue || 0) / (summary?.totalEvents || 1)).toLocaleString()}`} 
            subtitle={<span className="font-bold text-slate-400">Stable vs last month</span>}
          />
        </div>

        {/* Filter Bar Section */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 p-1.5 flex gap-1 items-center">
              <span className="material-symbols-outlined text-slate-400 pl-3 pr-1 text-xl">calendar_month</span>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-2 pr-6 py-2 bg-transparent border-none text-[13px] font-black text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer appearance-none uppercase tracking-widest"
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Year to Date</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 p-1.5 flex items-center">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 py-2 bg-transparent border-none text-[13px] font-black text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer appearance-none uppercase tracking-widest"
              >
                <option>All Status</option>
                <option>Published</option>
                <option>Draft</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="pl-14 pr-8 py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 text-[13px] font-bold text-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 w-72 lg:w-96 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none transition-all" 
                placeholder="Search by Organizer ID..." 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Sort Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 p-1.5 flex items-center">
              <select 
                value={`Sort by: ${sortByField}`}
                onChange={(e) => setSortByField(e.target.value.replace('Sort by: ', ''))}
                className="px-6 py-2 bg-transparent border-none text-[13px] font-black text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer appearance-none uppercase tracking-widest"
              >
                <option>Sort by: Date</option>
                <option>Sort by: Revenue</option>
                <option>Sort by: Tickets</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Analytics Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                  <th className="py-6 px-8 shrink-0 w-20"></th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Event Detail</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Status</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Launch Date</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Sales Velocity</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Gross Yield</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Avg Value</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Net P&L</th>
                  <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest font-inter">Efficiency</th>
                  <th className="py-6 px-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {events.map((node) => (
                  <CollapsibleRow key={node.eventId} node={node} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-800/20 px-10 py-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 font-inter">
              Aggregating <span className="text-slate-900 dark:text-slate-100">{events.length}</span> results 
              from <span className="text-slate-900 dark:text-slate-100">{analytics?.events.totalCount || events.length}</span> total entries
            </span>
            <div className="flex gap-4">
              <button 
                disabled={!analytics?.events.pageInfo.hasNextPage}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/50 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
              </button>
              <button 
                disabled={!analytics?.events.pageInfo.hasNextPage}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/50 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalyticsPage;
