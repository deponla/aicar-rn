import { Colors, FontFamily } from "@/constants/theme";
import i18n from "@/i18n";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ErrorBoundaryState {
    hasError: boolean;
}

export default class ErrorBoundary extends React.Component<
    React.PropsWithChildren,
    ErrorBoundaryState
> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>⚠️</Text>
                    <Text style={styles.title}>{i18n.t("errorBoundary.title")}</Text>
                    <Text style={styles.subtitle}>
                        {i18n.t("errorBoundary.description")}
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={this.handleReset}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{i18n.t("common.retry")}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 32,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontFamily: FontFamily.bold,
        fontSize: 20,
        color: Colors.primary,
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
    },
    buttonText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
        color: "#fff",
    },
});
