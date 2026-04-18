import { Colors } from "@/constants/theme";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export interface RichTextEditorRef {
  blur: () => void;
}

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const QUILL_HTML = (placeholder: string, initialValue: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      color: #1A1A2E;
      background: #fff;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    #editor-container {
      min-height: 150px;
    }
    .ql-toolbar.ql-snow {
      border: none;
      border-bottom: 1px solid #E5E5EA;
      padding: 6px 4px;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 10;
    }
    .ql-container.ql-snow {
      border: none;
      font-size: 15px;
    }
    .ql-editor {
      min-height: 150px;
      padding: 12px;
      line-height: 1.6;
      color: #1A1A2E;
    }
    .ql-editor.ql-blank::before {
      color: #8E8E93;
      font-style: normal;
    }
    .ql-editor img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 8px 0;
      display: block;
    }
    .ql-snow .ql-stroke {
      stroke: #555;
    }
    .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill {
      fill: #555;
    }
    .ql-snow.ql-toolbar button:hover .ql-stroke,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke {
      stroke: ${Colors.primary};
    }
    .ql-snow.ql-toolbar button:hover .ql-fill,
    .ql-snow.ql-toolbar button.ql-active .ql-fill {
      fill: ${Colors.primary};
    }
  </style>
</head>
<body>
  <div id="editor-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
  <script>
    const quill = new Quill('#editor-container', {
      theme: 'snow',
      placeholder: ${JSON.stringify(placeholder)},
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'header': [1, 2, 3, false] }],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });

    // Set initial content
    const initialContent = ${JSON.stringify(initialValue)};
    if (initialContent) {
      quill.root.innerHTML = initialContent;
    }

    // Debounce helper
    let debounceTimer;
    function debounce(fn, delay) {
      return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn(...args), delay);
      };
    }

    // Send HTML content back to React Native on change
    const sendContent = debounce(() => {
      const html = quill.root.innerHTML;
      const isEmpty = quill.getText().trim().length === 0 && !quill.root.querySelector('img');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'content-change',
        html: isEmpty ? '' : html
      }));
    }, 300);

    quill.on('text-change', sendContent);

    // Update height
    function updateHeight() {
      const height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'height-change',
        height: height
      }));
    }

    // Observe size changes
    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.querySelector('#editor-container'));
    setTimeout(updateHeight, 100);

    // Listen for setContent messages from RN
    function handleRNMessage(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'set-content') {
          quill.root.innerHTML = data.html || '';
        }
      } catch(err) {}
    }
    window.addEventListener('message', handleRNMessage);
    document.addEventListener('message', handleRNMessage);

    // Listen for blur command from RN
    function handleBlur(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'blur') {
          quill.blur();
          document.activeElement && document.activeElement.blur();
        }
      } catch(err) {}
    }
    window.addEventListener('message', handleBlur);
    document.addEventListener('message', handleBlur);
  </script>
</body>
</html>
`;

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      initialValue = "",
      onChange,
      placeholder = "Yazınızı buraya giriniz...",
      minHeight = 200,
    },
    ref,
  ) {
    const webViewRef = useRef<WebView>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const minHeightRef = useRef(minHeight);
    minHeightRef.current = minHeight;

    const [editorHeight, setEditorHeight] = React.useState(minHeight);

    useImperativeHandle(ref, () => ({
      blur: () => {
        webViewRef.current?.postMessage(JSON.stringify({ type: "blur" }));
      },
    }));

    // Stable source object — only created once with initial values
    const htmlSource = useMemo(
      () => ({ html: QUILL_HTML(placeholder, initialValue) }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    // Stable handler — never changes, uses refs for latest callbacks
    const handleMessage = useCallback((event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "content-change") {
          onChangeRef.current?.(data.html);
        } else if (data.type === "height-change") {
          const newHeight = Math.max(data.height, minHeightRef.current);
          setEditorHeight(newHeight);
        }
      } catch {
        // ignore parse errors
      }
    }, []);

    return (
      <View style={[styles.container, { minHeight }]}>
        <WebView
          ref={webViewRef}
          source={htmlSource}
          style={[styles.webview, { height: editorHeight }]}
          onMessage={handleMessage}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={false}
          automaticallyAdjustContentInsets={false}
        />
      </View>
    );
  },
);

export default RichTextEditor;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
