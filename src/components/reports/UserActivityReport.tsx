import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, FileText, Users, Activity, TrendingUp } from 'lucide-react';
import { StockMovement } from '@/types/stock';
import { ReportFilterValues } from './ReportFilters';
import { exportToExcel, exportToPDF } from './exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface UserActivityReportProps {
  movements: StockMovement[];
  filters: ReportFilterValues;
}

interface UserProfile {
  user_id: string;
  full_name: string;
}

export function UserActivityReport({ movements, filters }: UserActivityReportProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      
      if (data) {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (filters.dateFrom && m.date < filters.dateFrom) return false;
      if (filters.dateTo && m.date > filters.dateTo) return false;
      if (filters.userId && m.handledBy !== users.find(u => u.user_id === filters.userId)?.full_name) return false;
      return true;
    });
  }, [movements, filters, users]);

  const userStats = useMemo(() => {
    const stats: Record<string, { 
      name: string;
      totalIn: number;
      totalOut: number;
      movementCount: number;
      lastActivity: string;
    }> = {};
    
    filteredMovements.forEach(m => {
      const userName = m.handledBy;
      if (!stats[userName]) {
        stats[userName] = {
          name: userName,
          totalIn: 0,
          totalOut: 0,
          movementCount: 0,
          lastActivity: m.date,
        };
      }
      stats[userName].movementCount++;
      if (m.type === 'giris') {
        stats[userName].totalIn += m.quantity;
      } else {
        stats[userName].totalOut += m.quantity;
      }
      if (m.date > stats[userName].lastActivity) {
        stats[userName].lastActivity = m.date;
      }
    });
    
    return Object.values(stats).sort((a, b) => b.movementCount - a.movementCount);
  }, [filteredMovements]);

  const pieData = useMemo(() => {
    return userStats.slice(0, 5).map(u => ({
      name: u.name,
      value: u.movementCount,
    }));
  }, [userStats]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

  const dailyUserActivity = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    
    filteredMovements.forEach(m => {
      if (!byDate[m.date]) {
        byDate[m.date] = {};
      }
      if (!byDate[m.date][m.handledBy]) {
        byDate[m.date][m.handledBy] = 0;
      }
      byDate[m.date][m.handledBy]++;
    });
    
    return Object.entries(byDate)
      .map(([date, users]) => ({
        date,
        ...users,
        total: Object.values(users).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMovements]);

  const exportData = useMemo(() => {
    return userStats.map(u => ({
      name: u.name,
      totalIn: u.totalIn,
      totalOut: u.totalOut,
      movementCount: u.movementCount,
      lastActivity: u.lastActivity,
    }));
  }, [userStats]);

  const columns = [
    { header: 'Kullanıcı', key: 'name', width: 25 },
    { header: 'Giriş Miktarı', key: 'totalIn', width: 15 },
    { header: 'Çıkış Miktarı', key: 'totalOut', width: 15 },
    { header: 'Hareket Sayısı', key: 'movementCount', width: 15 },
    { header: 'Son Aktivite', key: 'lastActivity', width: 15 },
  ];

  const handleExportExcel = () => {
    exportToExcel(exportData, columns, `kullanici-aktivite-${Date.now()}`);
  };

  const handleExportPDF = () => {
    exportToPDF(exportData, columns, `kullanici-aktivite-${Date.now()}`, 'Kullanıcı Aktivite Raporu');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                <p className="text-2xl font-bold">{userStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Activity className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Hareket</p>
                <p className="text-2xl font-bold text-success">{filteredMovements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ortalama/Kullanıcı</p>
                <p className="text-2xl font-bold">
                  {userStats.length > 0 ? Math.round(filteredMovements.length / userStats.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Users className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Aktif</p>
                <p className="text-lg font-bold truncate max-w-[120px]">
                  {userStats[0]?.name || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Bar Chart */}
        {userStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kullanıcı Bazlı Hareket Sayısı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userStats.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.length > 12 ? v.substring(0, 12) + '...' : v}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="movementCount" name="Hareket" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hareket Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name.substring(0, 10)}... (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data Table with Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">
              Kullanıcı Aktivite Listesi
              <Badge variant="secondary" className="ml-2">{userStats.length} kullanıcı</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead className="text-right">Giriş</TableHead>
                  <TableHead className="text-right">Çıkış</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead>Son Aktivite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.map((u) => (
                  <TableRow key={u.name}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-right text-success">{u.totalIn}</TableCell>
                    <TableCell className="text-right text-destructive">{u.totalOut}</TableCell>
                    <TableCell className="text-right font-semibold">{u.movementCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.lastActivity).toLocaleDateString('tr-TR')}
                    </TableCell>
                  </TableRow>
                ))}
                {userStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Seçilen filtrelere uygun aktivite bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
