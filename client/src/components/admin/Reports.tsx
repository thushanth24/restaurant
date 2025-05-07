import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  PieController
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Register Chart.js components
Chart.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  PieController
);

export default function Reports() {
  const [timeRange, setTimeRange] = useState<string>('week');
  const [activeTab, setActiveTab] = useState<string>('sales');
  const { toast } = useToast();

  // Fetch sales data
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError
  } = useQuery({
    queryKey: ['/api/reports/sales', timeRange],
    queryFn: async () => {
      try {
        // This would be a real API call in production
        // For now, generate some realistic sample data
        if (timeRange === 'week') {
          return {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [
              {
                label: 'Sales',
                data: [1250, 1340, 1200, 1550, 1800, 2200, 1950],
                backgroundColor: 'hsl(var(--primary))',
              }
            ],
            totalSales: 11290,
            comparisonPercentage: 15.2, // compared to previous period
          };
        } else if (timeRange === 'month') {
          // Generate 30 days of data
          const labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
          const data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 1500) + 800);
          return {
            labels,
            datasets: [
              {
                label: 'Sales',
                data,
                backgroundColor: 'hsl(var(--primary))',
              }
            ],
            totalSales: data.reduce((sum, val) => sum + val, 0),
            comparisonPercentage: 8.7,
          };
        } else {
          // Year data - months
          return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
              {
                label: 'Sales',
                data: [32000, 29000, 35000, 33000, 38000, 42000, 45000, 44000, 40000, 43000, 48000, 52000],
                backgroundColor: 'hsl(var(--primary))',
              }
            ],
            totalSales: 481000,
            comparisonPercentage: 22.5,
          };
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        toast({
          title: 'Failed to load sales data',
          description: 'Could not fetch sales report data.',
          variant: 'destructive',
        });
        return null;
      }
    },
  });

  // Fetch popular items data
  const {
    data: popularItemsData,
    isLoading: itemsLoading,
    error: itemsError
  } = useQuery({
    queryKey: ['/api/reports/popular-items', timeRange],
    queryFn: async () => {
      try {
        // This would be a real API call in production
        return {
          labels: ['Cheeseburger', 'Tomato Bruschetta', 'Grilled Salmon', 'Caesar Salad', 'Sparkling Water'],
          datasets: [
            {
              label: 'Orders',
              data: [124, 95, 87, 76, 68],
              backgroundColor: [
                'hsl(var(--chart-1))',
                'hsl(var(--chart-2))',
                'hsl(var(--chart-3))',
                'hsl(var(--chart-4))',
                'hsl(var(--chart-5))',
              ],
            }
          ],
        };
      } catch (error) {
        console.error('Error fetching popular items data:', error);
        toast({
          title: 'Failed to load popular items data',
          description: 'Could not fetch popular items report data.',
          variant: 'destructive',
        });
        return null;
      }
    },
  });

  // Fetch table turnover data
  const {
    data: tableData,
    isLoading: tableLoading,
    error: tableError
  } = useQuery({
    queryKey: ['/api/reports/table-turnover', timeRange],
    queryFn: async () => {
      try {
        // This would be a real API call in production
        return {
          labels: ['1-10', '11-20', '21-30', '31-40', '41-50'],
          datasets: [
            {
              label: 'Average Time (minutes)',
              data: [45, 62, 38, 57, 42],
              backgroundColor: 'hsl(var(--secondary))',
              borderColor: 'hsl(var(--secondary))',
              fill: false,
              tension: 0.4,
            }
          ],
          avgTurnoverTime: 49,
          totalOrders: 827,
        };
      } catch (error) {
        console.error('Error fetching table turnover data:', error);
        toast({
          title: 'Failed to load table data',
          description: 'Could not fetch table turnover report data.',
          variant: 'destructive',
        });
        return null;
      }
    },
  });

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  return (
    <div className="reports">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Reports</h2>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="items">Popular Items</TabsTrigger>
          <TabsTrigger value="tables">Table Turnover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesLoading ? 
                    <div className="animate-pulse h-8 w-28 bg-neutral-200 rounded"></div> : 
                    formatCurrency(salesData?.totalSales || 0)
                  }
                </div>
                {salesData?.comparisonPercentage && (
                  <p className={`text-xs mt-1 ${salesData.comparisonPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>{salesData.comparisonPercentage > 0 ? '↑' : '↓'}</span> 
                    {Math.abs(salesData.comparisonPercentage)}% from previous period
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesLoading ? 
                    <div className="animate-pulse h-8 w-28 bg-neutral-200 rounded"></div> : 
                    formatCurrency(tableData ? (salesData?.totalSales || 0) / (tableData.totalOrders || 1) : 0)
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tableLoading ? 
                    <div className="animate-pulse h-8 w-28 bg-neutral-200 rounded"></div> : 
                    tableData?.totalOrders || 0
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="animate-pulse w-full h-[300px] bg-neutral-100 rounded-lg"></div>
              ) : salesError ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <p className="text-red-500">Failed to load sales data</p>
                </div>
              ) : salesData ? (
                <div className="w-full h-[300px]">
                  <Bar 
                    data={salesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="animate-pulse w-full h-[300px] bg-neutral-100 rounded-lg"></div>
                ) : itemsError ? (
                  <div className="w-full h-[300px] flex items-center justify-center">
                    <p className="text-red-500">Failed to load popular items data</p>
                  </div>
                ) : popularItemsData ? (
                  <div className="w-full h-[300px]">
                    <Pie 
                      data={popularItemsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                        },
                      }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Items by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="animate-pulse w-full h-[300px] bg-neutral-100 rounded-lg"></div>
                ) : itemsError ? (
                  <div className="w-full h-[300px] flex items-center justify-center">
                    <p className="text-red-500">Failed to load items revenue data</p>
                  </div>
                ) : popularItemsData ? (
                  <div className="w-full h-[300px]">
                    <Bar 
                      data={{
                        labels: popularItemsData.labels,
                        datasets: [
                          {
                            label: 'Revenue',
                            data: popularItemsData.datasets[0].data.map(count => 
                              // Simulate average price per item
                              count * (Math.random() * 5 + 10).toFixed(2)
                            ),
                            backgroundColor: 'hsl(var(--accent))',
                          }
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                          y: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tables">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Avg Turnover Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tableLoading ? 
                    <div className="animate-pulse h-8 w-28 bg-neutral-200 rounded"></div> : 
                    `${tableData?.avgTurnoverTime || 0} min`
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Total Table Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tableLoading ? 
                    <div className="animate-pulse h-8 w-28 bg-neutral-200 rounded"></div> : 
                    tableData?.totalOrders || 0
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Peak Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tableLoading ? 
                    <div className="animate-pulse h-8 w-28 bg-neutral-200 rounded"></div> : 
                    `6:00 PM - 8:00 PM`
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Table Turnover Time</CardTitle>
            </CardHeader>
            <CardContent>
              {tableLoading ? (
                <div className="animate-pulse w-full h-[300px] bg-neutral-100 rounded-lg"></div>
              ) : tableError ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <p className="text-red-500">Failed to load table data</p>
                </div>
              ) : tableData ? (
                <div className="w-full h-[300px]">
                  <Line 
                    data={{
                      labels: tableData.labels.map(label => `Table ${label}`),
                      datasets: tableData.datasets,
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          },
                          title: {
                            display: true,
                            text: 'Minutes',
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
