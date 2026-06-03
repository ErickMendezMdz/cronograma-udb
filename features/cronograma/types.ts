export type Subject = {
  id: string;
  code: string;
  name: string | null;
  order_index: number;
};

export type UniEventType = "evaluado_entrega" | "reunion" | "teorica";

export type UniEvent = {
  id: string;
  subject_id: string;
  title: string;
  type: UniEventType;
  date: string;
  end_date: string;
  weight_percent: number | null;
};

export type UniEventRow = UniEvent & {
  end_date: string | null;
};

export type EventDraft = {
  subjectId: string;
  title: string;
  type: UniEventType;
  startDate: string;
  endDate: string;
  weight: string;
};

export type WeekDay = {
  iso: string;
  dowLabel: string;
  dayNum: number;
  monthLabel: string;
};

export type CalendarBar = UniEvent & {
  startIdx: number;
  endIdx: number;
  lane: number;
};
