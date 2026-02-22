import { useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface DiaryHeatmapProps {
  movieDiary: Array<{ watched_date: string }>;
  tvDiary: Array<{ watched_date: string }>;
  onDayClick?: (date: string) => void;
}

const WEEKS = 20;
const DAYS = WEEKS * 7;

export const DiaryHeatmap = ({ movieDiary, tvDiary, onDayClick }: DiaryHeatmapProps) => {
  const { dayCounts, days } = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, DAYS - 1);
    const days = eachDayOfInterval({ start: startDate, end: today });

    const counts: Record<string, number> = {};
    [...movieDiary, ...tvDiary].forEach(entry => {
      const key = entry.watched_date.substring(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });

    return { dayCounts: counts, days };
  }, [movieDiary, tvDiary]);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/25';
    if (count === 2) return 'bg-primary/45';
    if (count === 3) return 'bg-primary/65';
    return 'bg-primary/90';
  };

  // Group days into weeks (columns)
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="mb-4">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Viewing Activity</p>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const count = dayCounts[key] || 0;
              return (
                <button
                  key={key}
                  onClick={() => onDayClick?.(key)}
                  title={`${format(day, 'MMM d, yyyy')}: ${count} ${count === 1 ? 'entry' : 'entries'}`}
                  className={`w-3 h-3 rounded-sm ${getIntensity(count)} hover:ring-1 hover:ring-primary/50 transition-all`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-1.5 justify-end">
        <span className="text-[10px] text-muted-foreground mr-1">Less</span>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${getIntensity(i)}`} />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
};
