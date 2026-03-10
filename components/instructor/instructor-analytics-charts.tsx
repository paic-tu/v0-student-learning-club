"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

type CoursePerformance = {
  id: string
  titleEn?: string | null
  titleAr?: string | null
  enrollment_count?: number | string | null
  revenue?: number | string | null
  rating?: number | string | null
}

function toNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0
  return Number.isFinite(n) ? n : 0
}

export function InstructorAnalyticsCharts({
  courses,
  isAr,
}: {
  courses: CoursePerformance[]
  isAr: boolean
}) {
  const data = (courses || []).map((c) => ({
    id: c.id,
    name: (isAr ? c.titleAr : c.titleEn) || (isAr ? "دورة" : "Course"),
    students: toNumber(c.enrollment_count),
    revenue: toNumber(c.revenue),
    rating: toNumber(c.rating),
  }))

  const empty = data.length === 0

  if (empty) {
    return (
      <div className="text-sm text-muted-foreground">
        {isAr ? "لا توجد بيانات كافية لعرض الرسوم البيانية." : "Not enough data to show charts."}
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2" dir={isAr ? "rtl" : "ltr"}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <Tooltip
              cursor={{ fill: "color-mix(in oklch, var(--muted) 60%, transparent)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
              }}
              labelStyle={{ color: "var(--card-foreground)" }}
            />
            <Bar dataKey="students" name={isAr ? "الطلاب" : "Students"} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <Tooltip
              cursor={{ fill: "color-mix(in oklch, var(--muted) 60%, transparent)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
              }}
              labelStyle={{ color: "var(--card-foreground)" }}
              formatter={(value: unknown) => {
                const n = toNumber(value)
                return [n.toFixed(2), isAr ? "الإيراد" : "Revenue"]
              }}
            />
            <Bar dataKey="revenue" name={isAr ? "الإيراد" : "Revenue"} fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

