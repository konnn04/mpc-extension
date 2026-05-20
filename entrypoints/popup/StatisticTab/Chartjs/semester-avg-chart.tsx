import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { StatisticDataType } from "@/entrypoints/popup/StatisticTab/type";
import { formatSemesterShort } from "@/utils/score";

type Props = {
  statistic: StatisticDataType;
};

const SemesterAverageChart = ({ statistic }: Props) => {
  if (!statistic.semester.data || statistic.semester.data.length === 0) {
    return null;
  }

  const chartData = statistic.semester.data.map((s) => ({
    term: formatSemesterShort(s.title),
    scale10: s.scale10,
    scale4: s.scale4
  }));

  const chartConfig = {
    scale10: { label: "Điểm hệ 10", color: "rgb(54, 162, 235)" },
    scale4: { label: "Điểm hệ 4", color: "#fb900b" }
  } satisfies ChartConfig;

  return (
    <div className='p-6'>
      <h3 className='mb-4 text-center font-semibold text-sm'>ĐIỂM TRUNG BÌNH QUA TỪNG HỌC KỲ</h3>
      <ChartContainer className='aspect-auto h-75 w-full' config={chartConfig}>
        <ComposedChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis axisLine={false} dataKey='term' tick={false} tickLine={false} tickMargin={10} />
          <YAxis axisLine={false} domain={[0, 10]} tickLine={false} tickMargin={10} yAxisId='y10' />
          <YAxis axisLine={false} domain={[0, 4]} orientation='right' tickLine={false} tickMargin={10} yAxisId='y4' />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey='scale10'
            dot={{ r: 4 }}
            stroke='var(--color-scale10)'
            strokeWidth={2}
            type='monotone'
            yAxisId='y10'
          />
          <Line
            dataKey='scale4'
            dot={{ r: 4 }}
            stroke='var(--color-scale4)'
            strokeWidth={2}
            type='monotone'
            yAxisId='y4'
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
};

export { SemesterAverageChart };
