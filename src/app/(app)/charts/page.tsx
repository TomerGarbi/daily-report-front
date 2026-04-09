"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ComposedChart,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ──────────────────────────── Fake Data ────────────────────────────

const monthlyRevenue = [
  { month: "Jan", revenue: 18600 },
  { month: "Feb", revenue: 22400 },
  { month: "Mar", revenue: 19800 },
  { month: "Apr", revenue: 27100 },
  { month: "May", revenue: 31500 },
  { month: "Jun", revenue: 28900 },
  { month: "Jul", revenue: 34200 },
  { month: "Aug", revenue: 30100 },
  { month: "Sep", revenue: 36800 },
  { month: "Oct", revenue: 41200 },
  { month: "Nov", revenue: 38500 },
  { month: "Dec", revenue: 45000 },
];

const userGrowth = [
  { month: "Jan", users: 1200, active: 980 },
  { month: "Feb", users: 1450, active: 1100 },
  { month: "Mar", users: 1680, active: 1350 },
  { month: "Apr", users: 2100, active: 1720 },
  { month: "May", users: 2560, active: 2100 },
  { month: "Jun", users: 2890, active: 2450 },
  { month: "Jul", users: 3400, active: 2800 },
  { month: "Aug", users: 3850, active: 3200 },
  { month: "Sep", users: 4200, active: 3600 },
  { month: "Oct", users: 4800, active: 4100 },
  { month: "Nov", users: 5300, active: 4650 },
  { month: "Dec", users: 5900, active: 5200 },
];

const websiteTraffic = [
  { month: "Jan", desktop: 4200, mobile: 3800, tablet: 1200 },
  { month: "Feb", desktop: 4800, mobile: 4200, tablet: 1400 },
  { month: "Mar", desktop: 5100, mobile: 5000, tablet: 1600 },
  { month: "Apr", desktop: 5600, mobile: 5800, tablet: 1800 },
  { month: "May", desktop: 5200, mobile: 6400, tablet: 2000 },
  { month: "Jun", desktop: 5800, mobile: 7200, tablet: 2200 },
];

const marketShare = [
  { name: "Product A", value: 35, fill: "hsl(220, 70%, 50%)" },
  { name: "Product B", value: 25, fill: "hsl(160, 60%, 45%)" },
  { name: "Product C", value: 20, fill: "hsl(30, 80%, 55%)" },
  { name: "Product D", value: 12, fill: "hsl(280, 65%, 60%)" },
  { name: "Other", value: 8, fill: "hsl(340, 75%, 55%)" },
];

const budgetAllocation = [
  { name: "Engineering", value: 40, fill: "hsl(220, 70%, 50%)" },
  { name: "Marketing", value: 20, fill: "hsl(160, 60%, 45%)" },
  { name: "Sales", value: 15, fill: "hsl(30, 80%, 55%)" },
  { name: "Operations", value: 15, fill: "hsl(280, 65%, 60%)" },
  { name: "HR", value: 10, fill: "hsl(340, 75%, 55%)" },
];

const salesByCategory = [
  { month: "Jan", electronics: 4500, clothing: 3200, food: 2100 },
  { month: "Feb", electronics: 5200, clothing: 3800, food: 2400 },
  { month: "Mar", electronics: 4800, clothing: 4100, food: 2600 },
  { month: "Apr", electronics: 6100, clothing: 3600, food: 2800 },
  { month: "May", electronics: 5800, clothing: 4500, food: 3100 },
  { month: "Jun", electronics: 7200, clothing: 4800, food: 3400 },
];

const performanceMetrics = [
  { metric: "Speed", A: 90, B: 70, fullMark: 100 },
  { metric: "Reliability", A: 85, B: 80, fullMark: 100 },
  { metric: "Comfort", A: 70, B: 90, fullMark: 100 },
  { metric: "Safety", A: 95, B: 75, fullMark: 100 },
  { metric: "Efficiency", A: 80, B: 85, fullMark: 100 },
  { metric: "Design", A: 75, B: 92, fullMark: 100 },
];

const taskCompletion = [
  { name: "Design", value: 85, fill: "hsl(220, 70%, 50%)" },
  { name: "Dev", value: 72, fill: "hsl(160, 60%, 45%)" },
  { name: "Testing", value: 58, fill: "hsl(30, 80%, 55%)" },
  { name: "Deploy", value: 45, fill: "hsl(280, 65%, 60%)" },
];

const revenueVsProfit = [
  { month: "Jan", revenue: 18600, profit: 4200, margin: 22.6 },
  { month: "Feb", revenue: 22400, profit: 5800, margin: 25.9 },
  { month: "Mar", revenue: 19800, profit: 4600, margin: 23.2 },
  { month: "Apr", revenue: 27100, profit: 7200, margin: 26.6 },
  { month: "May", revenue: 31500, profit: 9100, margin: 28.9 },
  { month: "Jun", revenue: 28900, profit: 7800, margin: 27.0 },
];

const scatterData = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
  { x: 200, y: 180, z: 300 },
  { x: 160, y: 320, z: 350 },
  { x: 180, y: 350, z: 420 },
  { x: 130, y: 220, z: 250 },
  { x: 190, y: 150, z: 310 },
  { x: 175, y: 380, z: 380 },
];

const scatterData2 = [
  { x: 200, y: 260, z: 240 },
  { x: 240, y: 290, z: 220 },
  { x: 190, y: 290, z: 250 },
  { x: 198, y: 250, z: 210 },
  { x: 180, y: 280, z: 260 },
  { x: 210, y: 220, z: 230 },
  { x: 230, y: 310, z: 280 },
  { x: 220, y: 270, z: 270 },
];

const salesPipeline = [
  { stage: "Leads", value: 1200, fill: "hsl(220, 70%, 55%)" },
  { stage: "Qualified", value: 840, fill: "hsl(200, 65%, 50%)" },
  { stage: "Proposal", value: 520, fill: "hsl(180, 60%, 48%)" },
  { stage: "Negotiation", value: 310, fill: "hsl(160, 55%, 45%)" },
  { stage: "Closed", value: 190, fill: "hsl(140, 50%, 42%)" },
];

const topProducts = [
  { name: "Widget Pro", category: "Hardware", sales: 12450, revenue: 498000, growth: 12.5, status: "Active" },
  { name: "DataSync Cloud", category: "SaaS", sales: 8920, revenue: 356800, growth: 28.3, status: "Active" },
  { name: "SecureVault", category: "Security", sales: 7340, revenue: 293600, growth: -5.2, status: "Active" },
  { name: "AnalyticsPro", category: "Software", sales: 6180, revenue: 247200, growth: 18.7, status: "Active" },
  { name: "SmartBoard X1", category: "Hardware", sales: 5670, revenue: 226800, growth: 8.1, status: "Discontinued" },
  { name: "CloudStore", category: "SaaS", sales: 4890, revenue: 195600, growth: 42.6, status: "Active" },
  { name: "NetGuard", category: "Security", sales: 4210, revenue: 168400, growth: -2.8, status: "Active" },
  { name: "TaskFlow", category: "Software", sales: 3750, revenue: 150000, growth: 15.4, status: "Beta" },
];

const treemapData = [
  { name: "Engineering", size: 4200, fill: "hsl(220, 70%, 50%)" },
  { name: "Marketing", size: 2100, fill: "hsl(200, 65%, 55%)" },
  { name: "Sales", size: 1800, fill: "hsl(160, 60%, 50%)" },
  { name: "Operations", size: 1500, fill: "hsl(30, 80%, 55%)" },
  { name: "HR", size: 900, fill: "hsl(280, 65%, 55%)" },
  { name: "Finance", size: 1200, fill: "hsl(340, 75%, 55%)" },
  { name: "Legal", size: 600, fill: "hsl(0, 60%, 55%)" },
  { name: "Support", size: 1100, fill: "hsl(120, 50%, 50%)" },
];

const stockPrices = [
  { day: "Mon", AAPL: 178, GOOG: 142, MSFT: 380, AMZN: 185 },
  { day: "Tue", AAPL: 182, GOOG: 145, MSFT: 385, AMZN: 188 },
  { day: "Wed", AAPL: 179, GOOG: 140, MSFT: 378, AMZN: 182 },
  { day: "Thu", AAPL: 185, GOOG: 148, MSFT: 392, AMZN: 191 },
  { day: "Fri", AAPL: 190, GOOG: 151, MSFT: 398, AMZN: 195 },
];

const trafficSources = [
  { month: "Jan", organic: 4000, paid: 2400, social: 1800, referral: 1200 },
  { month: "Feb", organic: 4500, paid: 2800, social: 2100, referral: 1400 },
  { month: "Mar", organic: 5100, paid: 3200, social: 2600, referral: 1600 },
  { month: "Apr", organic: 5800, paid: 3600, social: 3000, referral: 1900 },
  { month: "May", organic: 6200, paid: 4000, social: 3400, referral: 2200 },
  { month: "Jun", organic: 7000, paid: 4400, social: 3800, referral: 2500 },
];

const employeePerformance = [
  { id: "EMP-001", name: "Daniel Cohen", department: "Engineering", role: "Senior Dev", projects: 8, hoursLogged: 172, efficiency: 94, status: "On Track" },
  { id: "EMP-002", name: "Sarah Levi", department: "Marketing", role: "Campaign Mgr", projects: 5, hoursLogged: 160, efficiency: 88, status: "On Track" },
  { id: "EMP-003", name: "Yoav Mizrahi", department: "Sales", role: "Account Exec", projects: 12, hoursLogged: 185, efficiency: 97, status: "Exceeding" },
  { id: "EMP-004", name: "Noa Peretz", department: "Engineering", role: "Frontend Dev", projects: 6, hoursLogged: 155, efficiency: 82, status: "At Risk" },
  { id: "EMP-005", name: "Amit Shapira", department: "Operations", role: "Ops Lead", projects: 4, hoursLogged: 168, efficiency: 91, status: "On Track" },
  { id: "EMP-006", name: "Maya Goldstein", department: "HR", role: "Recruiter", projects: 7, hoursLogged: 148, efficiency: 79, status: "At Risk" },
  { id: "EMP-007", name: "Eli Aronov", department: "Engineering", role: "Backend Dev", projects: 9, hoursLogged: 178, efficiency: 95, status: "Exceeding" },
  { id: "EMP-008", name: "Tamar Rivkin", department: "Finance", role: "Analyst", projects: 3, hoursLogged: 162, efficiency: 87, status: "On Track" },
  { id: "EMP-009", name: "Oren Katz", department: "Sales", role: "Sales Rep", projects: 11, hoursLogged: 190, efficiency: 92, status: "On Track" },
  { id: "EMP-010", name: "Shira Ben-David", department: "Marketing", role: "Content Writer", projects: 6, hoursLogged: 140, efficiency: 76, status: "At Risk" },
  { id: "EMP-011", name: "Ron Avraham", department: "Engineering", role: "DevOps", projects: 5, hoursLogged: 175, efficiency: 93, status: "On Track" },
  { id: "EMP-012", name: "Liat Haim", department: "Support", role: "Team Lead", projects: 8, hoursLogged: 165, efficiency: 89, status: "On Track" },
  { id: "EMP-013", name: "Gal Yosef", department: "Engineering", role: "QA Engineer", projects: 7, hoursLogged: 158, efficiency: 85, status: "On Track" },
  { id: "EMP-014", name: "Hila Stern", department: "Marketing", role: "SEO Specialist", projects: 4, hoursLogged: 152, efficiency: 90, status: "On Track" },
  { id: "EMP-015", name: "Noam Dayan", department: "Sales", role: "Sales Mgr", projects: 10, hoursLogged: 182, efficiency: 96, status: "Exceeding" },
  { id: "EMP-016", name: "Yael Hadad", department: "Operations", role: "Logistics", projects: 3, hoursLogged: 145, efficiency: 78, status: "At Risk" },
  { id: "EMP-017", name: "Tomer Gal", department: "Engineering", role: "Tech Lead", projects: 9, hoursLogged: 188, efficiency: 98, status: "Exceeding" },
  { id: "EMP-018", name: "Dana Malka", department: "Finance", role: "Controller", projects: 4, hoursLogged: 160, efficiency: 86, status: "On Track" },
  { id: "EMP-019", name: "Itay Rosen", department: "Support", role: "Support Agent", projects: 6, hoursLogged: 138, efficiency: 74, status: "At Risk" },
  { id: "EMP-020", name: "Michal Oz", department: "HR", role: "HR Manager", projects: 5, hoursLogged: 164, efficiency: 88, status: "On Track" },
];

const weeklyGoals = [
  { name: "Calls Made", current: 85, target: 100 },
  { name: "Emails Sent", current: 240, target: 300 },
  { name: "Meetings", current: 12, target: 15 },
  { name: "Deals Closed", current: 7, target: 10 },
  { name: "New Leads", current: 45, target: 50 },
];

// ──────────────────────────── Chart Configs ────────────────────────────

const revenueConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "hsl(220, 70%, 50%)" },
};

const userGrowthConfig: ChartConfig = {
  users: { label: "Total Users", color: "hsl(220, 70%, 50%)" },
  active: { label: "Active Users", color: "hsl(160, 60%, 45%)" },
};

const trafficConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(220, 70%, 50%)" },
  mobile: { label: "Mobile", color: "hsl(160, 60%, 45%)" },
  tablet: { label: "Tablet", color: "hsl(30, 80%, 55%)" },
};

const marketShareConfig: ChartConfig = {
  "Product A": { label: "Product A", color: "hsl(220, 70%, 50%)" },
  "Product B": { label: "Product B", color: "hsl(160, 60%, 45%)" },
  "Product C": { label: "Product C", color: "hsl(30, 80%, 55%)" },
  "Product D": { label: "Product D", color: "hsl(280, 65%, 60%)" },
  Other: { label: "Other", color: "hsl(340, 75%, 55%)" },
};

const budgetConfig: ChartConfig = {
  Engineering: { label: "Engineering", color: "hsl(220, 70%, 50%)" },
  Marketing: { label: "Marketing", color: "hsl(160, 60%, 45%)" },
  Sales: { label: "Sales", color: "hsl(30, 80%, 55%)" },
  Operations: { label: "Operations", color: "hsl(280, 65%, 60%)" },
  HR: { label: "HR", color: "hsl(340, 75%, 55%)" },
};

const salesCategoryConfig: ChartConfig = {
  electronics: { label: "Electronics", color: "hsl(220, 70%, 50%)" },
  clothing: { label: "Clothing", color: "hsl(160, 60%, 45%)" },
  food: { label: "Food", color: "hsl(30, 80%, 55%)" },
};

const performanceConfig: ChartConfig = {
  A: { label: "Product A", color: "hsl(220, 70%, 50%)" },
  B: { label: "Product B", color: "hsl(340, 75%, 55%)" },
};

const composedConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "hsl(220, 70%, 50%)" },
  profit: { label: "Profit", color: "hsl(160, 60%, 45%)" },
  margin: { label: "Margin %", color: "hsl(30, 80%, 55%)" },
};

const scatterConfig: ChartConfig = {
  groupA: { label: "Group A", color: "hsl(220, 70%, 50%)" },
  groupB: { label: "Group B", color: "hsl(340, 75%, 55%)" },
};

const pipelineConfig: ChartConfig = {
  value: { label: "Count", color: "hsl(220, 70%, 50%)" },
};

const stockConfig: ChartConfig = {
  AAPL: { label: "Apple", color: "hsl(220, 70%, 50%)" },
  GOOG: { label: "Google", color: "hsl(160, 60%, 45%)" },
  MSFT: { label: "Microsoft", color: "hsl(30, 80%, 55%)" },
  AMZN: { label: "Amazon", color: "hsl(280, 65%, 60%)" },
};

const trafficSourceConfig: ChartConfig = {
  organic: { label: "Organic", color: "hsl(220, 70%, 50%)" },
  paid: { label: "Paid", color: "hsl(160, 60%, 45%)" },
  social: { label: "Social", color: "hsl(30, 80%, 55%)" },
  referral: { label: "Referral", color: "hsl(280, 65%, 60%)" },
};

const treemapConfig: ChartConfig = {
  size: { label: "Budget ($K)", color: "hsl(220, 70%, 50%)" },
};

// ──────────────────────────── Custom Treemap Content ────────────────────────────

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
}

function CustomTreemapContent({ x = 0, y = 0, width = 0, height = 0, name, value, fill }: TreemapContentProps) {
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} rx={4} />
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#ffffffcc" fontSize={10}>
        ${value?.toLocaleString()}K
      </text>
    </g>
  );
}

// ──────────────────────────── Page ────────────────────────────

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Dashboard Charts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            15 chart examples with sample data
          </p>
        </div>

        {/* Row 1: Bar + Line + Area */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. Bar Chart – Monthly Revenue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Revenue</CardTitle>
              <CardDescription>Bar chart – 2025 revenue per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueConfig} className="h-[250px] w-full">
                <BarChart data={monthlyRevenue} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 2. Line Chart – User Growth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">User Growth</CardTitle>
              <CardDescription>Line chart – Total vs. active users</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={userGrowthConfig} className="h-[250px] w-full">
                <LineChart data={userGrowth} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="active" stroke="var(--color-active)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 3. Stacked Area Chart – Website Traffic */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Website Traffic</CardTitle>
              <CardDescription>Stacked area – by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trafficConfig} className="h-[250px] w-full">
                <AreaChart data={websiteTraffic} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="tablet" stackId="1" fill="var(--color-tablet)" stroke="var(--color-tablet)" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="mobile" stackId="1" fill="var(--color-mobile)" stroke="var(--color-mobile)" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="desktop" stackId="1" fill="var(--color-desktop)" stroke="var(--color-desktop)" fillOpacity={0.4} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Pie + Donut + Stacked Bar */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 4. Pie Chart – Market Share */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Market Share</CardTitle>
              <CardDescription>Pie chart – product distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={marketShareConfig} className="h-[250px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={marketShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {marketShare.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 5. Donut Chart – Budget Allocation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Budget Allocation</CardTitle>
              <CardDescription>Donut chart – department budgets</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={budgetConfig} className="h-[250px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  <Pie data={budgetAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                    {budgetAllocation.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 6. Stacked Bar Chart – Sales by Category */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sales by Category</CardTitle>
              <CardDescription>Stacked bar – product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesCategoryConfig} className="h-[250px] w-full">
                <BarChart data={salesByCategory} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="electronics" stackId="a" fill="var(--color-electronics)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="clothing" stackId="a" fill="var(--color-clothing)" />
                  <Bar dataKey="food" stackId="a" fill="var(--color-food)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Radar + Radial Bar + Composed */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 7. Radar Chart – Performance Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance Comparison</CardTitle>
              <CardDescription>Radar chart – product A vs B</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={performanceConfig} className="h-[250px] w-full">
                <RadarChart data={performanceMetrics} cx="50%" cy="50%" outerRadius="70%" accessibilityLayer>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Radar name="A" dataKey="A" stroke="var(--color-A)" fill="var(--color-A)" fillOpacity={0.3} />
                  <Radar name="B" dataKey="B" stroke="var(--color-B)" fill="var(--color-B)" fillOpacity={0.3} />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 8. Radial Bar Chart – Task Completion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Task Completion</CardTitle>
              <CardDescription>Radial bar – progress by phase</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ value: { label: "Progress", color: "hsl(220, 70%, 50%)" } }} className="h-[250px] w-full">
                <RadialBarChart innerRadius="20%" outerRadius="90%" data={taskCompletion} startAngle={180} endAngle={0} cx="50%" cy="70%" accessibilityLayer>
                  <RadialBar dataKey="value" background cornerRadius={6} label={{ fill: "#333", fontSize: 11, position: "insideStart" }} />
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" formatter={((value: string, entry: any) => entry?.payload?.name ?? value) as any} />
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 9. Composed Chart – Revenue vs Profit */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue vs Profit</CardTitle>
              <CardDescription>Composed – bar + line overlay</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={composedConfig} className="h-[250px] w-full">
                <ComposedChart data={revenueVsProfit} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="margin" stroke="var(--color-margin)" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Scatter + Pipeline + Table */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 10. Scatter Chart – Correlation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Correlation Analysis</CardTitle>
              <CardDescription>Scatter plot – two data groups</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scatterConfig} className="h-[250px] w-full">
                <ScatterChart accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Width" tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="y" name="Height" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Scatter name="Group A" data={scatterData} fill="hsl(220, 70%, 50%)" />
                  <Scatter name="Group B" data={scatterData2} fill="hsl(340, 75%, 55%)" />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 11. Horizontal Bar – Sales Pipeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sales Pipeline</CardTitle>
              <CardDescription>Horizontal bar – funnel stages</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pipelineConfig} className="h-[250px] w-full">
                <BarChart data={salesPipeline} layout="vertical" accessibilityLayer>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {salesPipeline.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 12. Table – Top Products */}
          <Card className="lg:row-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Products</CardTitle>
              <CardDescription>Table – best selling products</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[285px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-white">Product</TableHead>
                      <TableHead className="sticky top-0 bg-white text-right">Sales</TableHead>
                      <TableHead className="sticky top-0 bg-white text-right">Growth</TableHead>
                      <TableHead className="sticky top-0 bg-white text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.sales.toLocaleString()}</TableCell>
                        <TableCell className={`text-right tabular-nums ${p.growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {p.growth >= 0 ? "+" : ""}
                          {p.growth}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.status === "Active" ? "default" : p.status === "Beta" ? "secondary" : "outline"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 5: Treemap + Multi-line + Stacked Area */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 13. Treemap – Department Budget */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Department Budgets</CardTitle>
              <CardDescription>Treemap – budget distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={treemapConfig} className="h-[250px] w-full">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={<CustomTreemapContent />}
                />
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 14. Multi-Line Chart – Stock Prices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stock Prices</CardTitle>
              <CardDescription>Multi-line – weekly comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={stockConfig} className="h-[250px] w-full">
                <LineChart data={stockPrices} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="AAPL" stroke="var(--color-AAPL)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="GOOG" stroke="var(--color-GOOG)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="MSFT" stroke="var(--color-MSFT)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="AMZN" stroke="var(--color-AMZN)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 15. Stacked Area – Traffic Sources */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Traffic Sources</CardTitle>
              <CardDescription>Stacked area – acquisition channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trafficSourceConfig} className="h-[250px] w-full">
                <AreaChart data={trafficSources} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="referral" stackId="1" fill="var(--color-referral)" stroke="var(--color-referral)" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="social" stackId="1" fill="var(--color-social)" stroke="var(--color-social)" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="paid" stackId="1" fill="var(--color-paid)" stroke="var(--color-paid)" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="organic" stackId="1" fill="var(--color-organic)" stroke="var(--color-organic)" fillOpacity={0.5} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bonus Row: Weekly Goals Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Goals Progress</CardTitle>
            <CardDescription>Progress bars – team KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyGoals.map((goal) => {
                const pct = Math.round((goal.current / goal.target) * 100);
                return (
                  <div key={goal.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{goal.name}</span>
                      <span className="tabular-nums text-slate-500">
                        {goal.current}/{goal.target}{" "}
                        <span className={pct >= 100 ? "text-green-600" : pct >= 70 ? "text-amber-500" : "text-red-500"}>
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Big Table – Employee Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Employee Performance Overview</CardTitle>
            <CardDescription>Comprehensive table – 20 employees across all departments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-white min-w-[100px]">ID</TableHead>
                    <TableHead className="sticky top-0 bg-white min-w-[160px]">Name</TableHead>
                    <TableHead className="sticky top-0 bg-white min-w-[130px]">Department</TableHead>
                    <TableHead className="sticky top-0 bg-white min-w-[140px]">Role</TableHead>
                    <TableHead className="sticky top-0 bg-white text-right min-w-[90px]">Projects</TableHead>
                    <TableHead className="sticky top-0 bg-white text-right min-w-[110px]">Hours Logged</TableHead>
                    <TableHead className="sticky top-0 bg-white text-right min-w-[110px]">Efficiency</TableHead>
                    <TableHead className="sticky top-0 bg-white text-right min-w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeePerformance.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs text-slate-500">{emp.id}</TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell className="text-slate-600">{emp.role}</TableCell>
                      <TableCell className="text-right tabular-nums">{emp.projects}</TableCell>
                      <TableCell className="text-right tabular-nums">{emp.hoursLogged}h</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={emp.efficiency} className="h-2 w-16" />
                          <span className={`tabular-nums text-xs font-medium ${
                            emp.efficiency >= 90 ? "text-green-600" : emp.efficiency >= 80 ? "text-amber-500" : "text-red-500"
                          }`}>
                            {emp.efficiency}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            emp.status === "Exceeding" ? "default" :
                            emp.status === "On Track" ? "secondary" : "destructive"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
