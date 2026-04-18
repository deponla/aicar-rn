import { tokens } from "@/constants/theme";
import { isHtml, normalizeBlogHtmlImages } from "@/utils/blog";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

interface BlogContentProps {
  readonly content: string;
  readonly contentType?: "html" | "markdown";
}

const HTML_TEMPLATE = (body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      color: #1C1C1E;
      padding: 0;
      background: transparent;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
    }
    h1, h2, h3, h4 { margin: 16px 0 8px; font-weight: 600; color: #111; }
    h1 { font-size: 24px; }
    h2 { font-size: 20px; }
    h3 { font-size: 18px; }
    p { margin: 8px 0; }
    a { color: #002e6d; font-weight: 500; text-decoration: none; }
    ul, ol { padding-left: 20px; margin: 8px 0; }
    li { margin: 4px 0; }
    blockquote {
      border-left: 3px solid #4ac6e2;
      padding-left: 12px;
      margin: 12px 0;
      color: #6B6B6B;
      font-style: italic;
    }
    pre { background: #f4f5f7; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 14px; }
    code { background: #f4f5f7; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
    pre code { background: none; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #e5e5ea; padding: 8px; text-align: left; font-size: 14px; }
    th { background: #f4f5f7; font-weight: 600; }
  </style>
</head>
<body>
  ${body}
  <script>
    function sendHeight() {
      const height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: height }));
    }
    window.addEventListener('load', sendHeight);
    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
    setTimeout(sendHeight, 300);
  </script>
</body>
</html>`;

export default function BlogContent({
  content,
  contentType,
}: BlogContentProps) {
  const t = tokens;
  const [webViewHeight, setWebViewHeight] = useState(300);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "height" && typeof data.value === "number") {
          setWebViewHeight(data.value + 20);
        }
      } catch {
        // ignore parse errors
      }
    },
    [],
  );

  const useWebView =
    contentType === "html" || contentType === "markdown" || isHtml(content);

  if (useWebView) {
    const normalized = normalizeBlogHtmlImages(content);
    const html = HTML_TEMPLATE(normalized);

    return (
      <View style={[styles.container, { backgroundColor: t.bgSurface }]}>
        <WebView
          source={{ html }}
          style={{ height: webViewHeight }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleMessage}
          originWhitelist={["*"]}
        />
      </View>
    );
  }

  // Plain text rendering
  const paragraphs = content
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: t.bgSurface }]}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={[styles.paragraph, { color: t.textPrimary }]}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },
});
