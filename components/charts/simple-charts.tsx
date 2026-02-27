"use client";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserPlan } from "@/hooks/use-user-plan";

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartWrapperProps {
  title: string;
  data: BarChartData[];
  className?: string;
}

export function BarChartWrapper({
  title,
  data,
  className,
}: BarChartWrapperProps) {
  const { isPro } = useUserPlan()
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              isAnimationActive={isPro}
              animationDuration={1000}
              animationEasing="ease-in-out"
            >
              {data.map((entry, index) => (
                <Cell
                className="bar-cell"
                  key={`cell-${index}`}
                  style={{ fill: "hsl(var(--primary))" }}
                  fill={"hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartWrapperProps {
  title: string;
  data: DonutChartData[];
  className?: string;
}

export function DonutChartWrapper({
  title,
  data,
  className,
}: DonutChartWrapperProps) {
  const { isPro } = useUserPlan()
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={isPro}
              animationDuration={1000}
              animationEasing="ease-in-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
