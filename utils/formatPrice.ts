export const formatPrice = (value: string | number): string => {
  if (!value) return "";
  const numericValue = `${value}`.replaceAll(/\D/g, "");
  if (!numericValue) return "";
  return numericValue.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".");
};
