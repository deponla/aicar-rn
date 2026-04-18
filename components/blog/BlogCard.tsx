import { tokens } from "@/constants/theme";
import { BlogItem } from "@/types/blog";
import { extractTags, formatBlogDate, resolveBlogAssetUrl } from "@/utils/blog";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BlogCardProps {
  readonly blog: BlogItem;
  readonly onPress?: () => void;
}

export default function BlogCard({ blog, onPress }: BlogCardProps) {
  const t = tokens;
  const { categories, topics } = extractTags(blog.tags);
  const publishedAt = formatBlogDate(blog.publishedAt);
  const coverImage = resolveBlogAssetUrl(blog.coverImage);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: t.bgSurface, borderColor: t.borderSubtle },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {coverImage ? (
        <Image
          source={{ uri: coverImage }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}

      <View style={styles.content}>
        {/* Tags */}
        {(categories.length > 0 || topics.length > 0) && (
          <View style={styles.tagsRow}>
            {categories.slice(0, 2).map((cat) => (
              <View key={cat} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat.toUpperCase()}</Text>
              </View>
            ))}
            {topics.slice(0, 1).map((topic) => (
              <View key={topic} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{topic.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Title */}
        <Text
          style={[styles.title, { color: t.textPrimary }]}
          numberOfLines={2}
        >
          {blog.title}
        </Text>

        {/* Excerpt */}
        {blog.excerpt ? (
          <Text
            style={[styles.excerpt, { color: t.textSecondary }]}
            numberOfLines={3}
          >
            {blog.excerpt}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          {publishedAt ? (
            <Text style={[styles.date, { color: t.textTertiary }]}>
              {publishedAt}
            </Text>
          ) : null}
          <Text style={styles.readMore}>Oku →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  coverImage: {
    width: "100%",
    height: 160,
  },
  coverPlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: "#002e6d",
  },
  content: {
    padding: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
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
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  date: {
    fontSize: 12,
  },
  readMore: {
    fontSize: 13,
    fontWeight: "600",
    color: "#002e6d",
  },
});
