import { useGetDistrictById } from "@/query-hooks/useCity";
import { Text } from "react-native";

export default function DistrictById({ id }: Readonly<{ id: string }>) {
  const { data, isLoading, error } = useGetDistrictById({
    id,
  });

  if (isLoading) {
    return <Text>Yükleniyor...</Text>;
  }

  if (error || !data?.result) {
    return <Text style={{ color: "gray" }}>İlçe bulunamadı</Text>;
  }

  return <Text>{data.result.name}</Text>;
}
