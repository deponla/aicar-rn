import BlogCard from "@/components/blog/BlogCard";
import ScreenContainer from "@/components/ScreenContainer";
import { tokens } from "@/constants/theme";
import { useGetBlogsInfinite } from "@/query-hooks/useBlog";
import { BlogItem } from "@/types/blog";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function BlogListScreen() {
  const router = useRouter();
  const t = tokens;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useGetBlogsInfinite({
    filters: { publishedOnly: true, sort: "publishedAt:desc" },
  });

  const blogs = data?.pages.flatMap((page) => page.results) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: BlogItem }) => (
      <BlogCard
        blog={item}
        onPress={() => router.push(`/profile/blog/${item.slug}`)}
      />
    ),
    [router],
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[styles.emptyIconCircle, { backgroundColor: t.primaryLight }]}
        >
          <MaterialIcons name="article" size={40} color={t.textTertiary} />
        </View>
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
          Henüz yazı yok
        </Text>
        <Text style={[styles.emptyDesc, { color: t.textSecondary }]}>
          Yeni içerikler yakında burada olacak.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  return (
    <ScreenContainer title="Blog" showBackButton scrollable={false}>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <LegendList
          data={blogs}
          renderItem={renderItem}
          keyExtractor={(item) => item.slug}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
