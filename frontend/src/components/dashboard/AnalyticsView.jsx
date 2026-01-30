import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ChartBar, TrendUp, Lightning, Users, Cpu, CalendarBlank } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { apiService } from '../../lib/apiService';
import { toast } from 'sonner';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#34d399'];

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalApiCalls: 0, avgResponseTime: 0, totalTokensUsed: 0 },
    callsOverTime: [],
    projectBreakdown: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analyticsData = await apiService.getAnalytics(timeRange);
        setData(analyticsData);
      } catch (error) {
        toast.error("Failed to load analytics data.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  // Format data for the pie chart and add colors
  const projectUsageData = data.projectBreakdown.map((project, index) => ({
    ...project,
    value: project.calls, // recharts Pie component uses 'value'
    color: PIE_COLORS[index % PIE_COLORS.length]
  }));

  // Format data for Bar and Line charts, which now share the same source
  const timeSeriesData = data.callsOverTime;

  // Mock data for metrics that we don't track yet (e.g., active users)
  const metrics = [
    { title: 'Total API Calls', value: data.summary.totalApiCalls.toLocaleString(), icon: ChartBar, color: 'text-blue-600' },
    { title: 'Response Time', value: `${(data.summary.avgResponseTime / 1000).toFixed(2)}s`, icon: Lightning, color: 'text-green-600' },
    { title: 'Active Users', value: '1', change: '', trend: 'up', icon: Users, color: 'text-purple-600' }, // Mocked
    { title: 'Token Usage', value: data.summary.totalTokensUsed.toLocaleString(), icon: Cpu, color: 'text-orange-600' }
  ];

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Analytics</h2><p className="text-muted-foreground">Monitor your AI platform performance and usage</p></div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]"><CalendarBlank size={16} className="mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div key={metric.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
            <Card className="hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  </div>
                  <metric.icon size={24} className={metric.color} weight="duotone" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList><TabsTrigger value="usage">Usage Trends</TabsTrigger><TabsTrigger value="projects">Project Breakdown</TabsTrigger></TabsList>
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>API Calls Over Time</CardTitle><CardDescription>Daily API call volume</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} formatter={(value) => [value.toLocaleString(), 'API Calls']} />
                    <Bar dataKey="calls" fill="oklch(0.45 0.15 250)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Token Consumption</CardTitle><CardDescription>Daily token usage trends</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} formatter={(value) => [value.toLocaleString(), 'Tokens']} />
                    <Line type="monotone" dataKey="tokens" stroke="oklch(0.65 0.12 180)" strokeWidth={3} dot={{ fill: 'oklch(0.65 0.12 180)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Usage by Project</CardTitle><CardDescription>API call distribution across projects</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={projectUsageData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value" nameKey="name">
                      {projectUsageData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Project Performance</CardTitle><CardDescription>Detailed breakdown by project</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectUsageData.map((project) => (
                    <div key={project.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <div><p className="font-medium text-sm">{project.name}</p><p className="text-xs text-muted-foreground">{project.calls.toLocaleString()} API calls</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}