import { useGetProvinceById } from "@/query-hooks/useCity";
import { Text } from "react-native";

export default function CityById({ id }: Readonly<{ id: string }>) {
  const { data, isLoading } = useGetProvinceById({
    id,
  });

  if (isLoading) {
    return <Text>Yükleniyor...</Text>;
  }

  return <Text>{data?.result?.name}</Text>;
}
