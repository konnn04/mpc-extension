import { LabelList, Pie, PieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { PointCharacterType } from "@/entrypoints/popup/PointTab/type";
import { GRADE_COLORS } from "@/utils/score";

type Props = {
  total: number;
  data: { [key in Exclude<PointCharacterType, "M">]: number };
};

const CharacterPointChart = ({ total, data }: Props) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    grade: key,
    count: value,
    fill: GRADE_COLORS[key] || "var(--color-primary)"
  }));

  const chartConfig = Object.entries(data).reduce(
    (acc, [key, _]) => {
      acc[key] = { label: key, color: GRADE_COLORS[key] };
      return acc;
    },
    { count: { label: "Số lượng" } } as ChartConfig
  );

  return (
    <div className='p-6'>
      <h3 className='mb-4 text-center font-semibold text-sm'>PHÂN BỐ ĐIỂM THEO THANG ĐIỂM CHỮ ({total} môn)</h3>
      <ChartContainer className='aspect-auto h-[250px] w-full' config={chartConfig}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie data={chartData} dataKey='count' innerRadius={40} nameKey='grade' paddingAngle={2} strokeWidth={2}>
            <LabelList dataKey='grade' fill='#fff' fontSize={12} fontWeight='bold' position='inside' stroke='none' />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
};

export { CharacterPointChart };
