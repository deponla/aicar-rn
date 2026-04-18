import BlogContent from "@/components/blog/BlogContent";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { useGetBlogBySlug } from "@/query-hooks/useBlog";
import {
  estimateReadingTime,
  extractTags,
  formatBlogDate,
  resolveBlogAssetUrl,
} from "@/utils/blog";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = tokens;
  const { data, isLoading } = useGetBlogBySlug({ slug });

  const blog = data?.result;
  const coverImage = resolveBlogAssetUrl(blog?.coverImage);
  const [showCoverImage, setShowCoverImage] = useState(Boolean(coverImage));

  useEffect(() => {
    setShowCoverImage(Boolean(coverImage));
  }, [coverImage]);

  const handleShare = async () => {
    if (!blog) return;
    const url = `https://deponla.com/blog/${blog.slug}`;
    await Share.share({ title: blog.title, url, message: blog.title });
  };

  const shareButton = (
    <TouchableOpacity onPress={handleShare} hitSlop={8}>
      <MaterialIcons name="share" size={22} color={Colors.primary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer title="Blog" showBackButton>
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!blog) {
    return (
      <ScreenContainer title="Blog" showBackButton>
        <View style={styles.loader}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={t.textTertiary}
          />
          <Text style={[styles.errorText, { color: t.textSecondary }]}>
            Yazı bulunamadı.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const { categories, topics } = extractTags(blog.tags);
  const publishedAt = formatBlogDate(blog.publishedAt);
  const readingTime = estimateReadingTime(blog.content);

  return (
    <ScreenContainer title="Blog" showBackButton headerRight={shareButton}>
      {/* Hero */}
      {coverImage && showCoverImage ? (
        <Image
          source={{ uri: coverImage }}
          style={styles.heroImage}
          resizeMode="cover"
          onError={() => setShowCoverImage(false)}
        />
      ) : null}

      <View style={styles.body}>
        {/* Tags */}
        {(categories.length > 0 || topics.length > 0) && (
          <View style={styles.tagsRow}>
            {categories.map((cat) => (
              <View key={cat} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat.toUpperCase()}</Text>
              </View>
            ))}
            {topics.map((topic) => (
              <View key={topic} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{topic.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Title */}
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {blog.title}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {publishedAt ? (
            <View style={styles.metaItem}>
              <MaterialIcons
                name="calendar-today"
                size={14}
                color={t.textTertiary}
              />
              <Text style={[styles.metaText, { color: t.textTertiary }]}>
                {publishedAt}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={14} color={t.textTertiary} />
            <Text style={[styles.metaText, { color: t.textTertiary }]}>
              {readingTime} dk okuma
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: t.borderDefault }]} />

        {/* Content */}
        <BlogContent content={blog.content} contentType={blog.contentType} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    marginTop: 4,
  },
  heroImage: {
    width: "100%",
    height: 220,
  },
  body: {
    padding: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: "#e6f2f8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#002e6d",
    letterSpacing: 0.5,
  },
  topicChip: {
    backgroundColor: "#fff4e5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  topicChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
});
