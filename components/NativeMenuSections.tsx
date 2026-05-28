import type { ReactNode } from "react";
import type { SFSymbols7_0 } from "sf-symbols-typescript";

export interface NativeMenuItem {
    title: string;
    systemImage: SFSymbols7_0;
    tintColor?: string;
    onPress: () => void;
}

export interface NativeMenuSectionData {
    title: string;
    items: NativeMenuItem[];
}

interface Props {
    sections: NativeMenuSectionData[];
    children?: ReactNode;
}

// Android fallback: render children (RN implementation)
export default function NativeMenuSections({ children }: Props) {
    return <>{children}</>;
}
