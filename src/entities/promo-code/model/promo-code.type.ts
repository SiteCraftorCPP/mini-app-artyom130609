export type PromoCode = {
  code: string;
  discount: number; // percentage, e.g. 10 for 10%
  activationsLeft: number | null; // null means infinite
  id: string;
};
